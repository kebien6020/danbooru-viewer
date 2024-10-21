import { $Container, $Element, $PointerManager } from "elexis";
import { $View } from "../../../elexis-ext/view";

export class $SlideViewer extends $Container {
    pointers = new $PointerManager(this);
    $container = $('div')
    constructor() {
        super('slide-viewer')
        this.__build__();
    }

    protected __build__() {
        this.content([ this.$container ]);
        this.pointers.on('move', $pointer => {
            const [x, y] = [$pointer.move_x, $pointer.move_y];
            this.$container.css({transform: `translate(${x}, ${y})`});
        })
    }

    addSlide(id: string, $element: $Element) {
        return this;
    }
}