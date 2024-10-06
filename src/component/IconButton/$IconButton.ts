import { $Button, type $ContainerContentBuilder } from "elexis";

export class $IconButton extends $Button {
    $icon = $('ion-icon');
    $label = $('span');
    constructor() {
        super();
        this.addStaticClass('icon')
        this.build();
    }

    private build() {
        super.content([
            this.$icon,
            this.$label
        ])
    }

    content(children: $ContainerContentBuilder<typeof this.$label>): this {
        this.$label.content(children);
        return this;
    }

    icon(name: string) {
        this.$icon.name(name);
        return this;
    }
}