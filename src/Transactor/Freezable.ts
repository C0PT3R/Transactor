export default abstract class Freezable {

    protected frozen = false

    public freeze(): void {
        if (this.frozen)
            return

        this.frozen = true
        
        try {
            this.onFreeze()
            Object.freeze(this)
        } catch (error) {
            this.frozen = false
            throw error
        }
    }

    protected abstract onFreeze(): void

}