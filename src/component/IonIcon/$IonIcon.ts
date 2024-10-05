import { $Container } from "elexis";

export class $IonIcon extends $Container {
    constructor() {
        super('ion-icon');
    }

    name(name: string) {
        this.attribute('name', name);
        return this;
    }

    size(size: 'small' | 'large') {
        this.attribute('size', size);
        return this;
    }
}