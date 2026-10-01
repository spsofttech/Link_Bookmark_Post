import dns from "node:dns/promises";

const regions = [
  "ap-south-1",
  "us-east-1",
  "us-west-1",
  "eu-central-1",
  "eu-west-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "sa-east-1",
  "ca-central-1"
];

async function testResolution() {
  console.log("--- TESTING SUPABASE HOST RESOLUTIONS ---");
  
  // Test direct host
  try {
    const directV4 = await dns.resolve4("db.erokumwxbkiabmwsmwpx.supabase.co");
    console.log("Direct Host IPv4:", directV4);
  } catch (err) {
    console.log("Direct Host IPv4 Failed:", err.message);
  }

  try {
    const directV6 = await dns.resolve6("db.erokumwxbkiabmwsmwpx.supabase.co");
    console.log("Direct Host IPv6:", directV6);
  } catch (err) {
    console.log("Direct Host IPv6 Failed:", err.message);
  }

  // Test Pooler hosts
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    try {
      const v4 = await dns.resolve4(host);
      console.log(`Pooler ${host} IPv4:`, v4);
    } catch (err) {
      // quiet
    }
  }
}

testResolution();
