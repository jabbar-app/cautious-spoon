export function redactSensitive(obj: any): any {
  try {
    const str = JSON.stringify(obj, (_, v) => v, 2);
    return JSON.parse(
      str
        .replace(/"password"\s*:\s*".*?"/gi, '"password":"**redacted**"')
        .replace(/"passwordHash"\s*:\s*".*?"/gi, '"passwordHash":"**redacted**"')
        .replace(/"token"\s*:\s*".*?"/gi, '"token":"**redacted**"')
        .replace(/"refresh_token"\s*:\s*".*?"/gi, '"refresh_token":"**redacted**"'),
    );
  } catch {
    return obj;
  }
}
