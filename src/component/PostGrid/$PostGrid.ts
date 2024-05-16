import { $Layout } from "@elexis/layout";

export class $PostGrid extends $Layout {
    constructor() {
        super();
        this.addStaticClass('post-grid')
        this.type('waterfall').column(5).maxHeight(300).gap(10);
    }
}