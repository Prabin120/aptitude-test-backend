const USER = new Set(["user"])
const CREATOR = new Set(["user", "creator"])
const VALIDATOR = new Set(["user", "creator", "validator"])
const ADMIN = new Set(["user", "creator", "validator", "admin"])

const roles = new Map<string, Set<string>>([
    ["user", USER],
    ["creator", CREATOR],
    ["validator", VALIDATOR],
    ["admin", ADMIN]
])

export const isUser = (role: string) => roles.get(role)?.has("user") ?? false
export const isCreator = (role: string) => roles.get(role)?.has("creator") ?? false
export const isValidator = (role: string) => roles.get(role)?.has("validator") ?? false
export const isAdmin = (role: string) => roles.get(role)?.has("admin") ?? false

export default roles