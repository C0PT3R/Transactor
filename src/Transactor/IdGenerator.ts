export default class IdGenerator {
    public static generate(): string {
        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2)
        )
    }
}