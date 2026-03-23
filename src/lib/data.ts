const GITHUB_TOKEN = process.env.GITHUB_PAT;
const REPO = "jcoffman-glitch/grease-threads-website";
const BRANCH = "data";

async function getFileSha(filename: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${filename}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.sha;
}

export async function readData<T>(filename: string): Promise<T[]> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${filename}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return JSON.parse(Buffer.from(json.content, "base64").toString("utf-8"));
}

export async function writeData<T>(
  filename: string,
  data: T[]
): Promise<void> {
  const sha = await getFileSha(filename);
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${filename}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update ${filename}`,
        content,
        sha: sha || undefined,
        branch: BRANCH,
      }),
    }
  );
}
