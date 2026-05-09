export const EnvProtection = async () => {
  const isSensitiveEnvFile = (value) => {
    if (!value || typeof value !== "string") return false

    const normalized = value.replace(/\\/g, "/").toLowerCase()
    const fileName = normalized.split("/").pop() || ""

    if (!fileName.includes(".env")) return false
    if (fileName.endsWith(".example")) return false
    if (fileName.endsWith(".sample")) return false
    if (fileName.endsWith(".template")) return false
    if (fileName === ".env.example") return false

    return fileName === ".env" || fileName.startsWith(".env.") || fileName.endsWith(".env")
  }

  const extractPath = (args) => {
    if (!args || typeof args !== "object") return undefined
    return args.filePath || args.path || args.filename || args.target
  }

  return {
    "tool.execute.before": async (input, output) => {
      const tool = input?.tool || output?.tool
      if (!tool || !["read", "edit", "write"].includes(tool)) return

      const filePath = extractPath(output?.args)
      if (isSensitiveEnvFile(filePath)) {
        throw new Error("Blocked access to a real .env file. Use .env.example or describe the needed variable names without exposing secrets.")
      }
    },
  }
}
