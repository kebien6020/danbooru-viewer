import { $Container } from "elexis";
import { Tag, TagCategory } from "../../structure/Tag";
import { Booru } from "../../structure/Booru";

export class $Searchbar extends $Container {
    $tagInput = new $TagInput(this);
    $selectionList = new $SelectionList();
    typingTimer: Timer | null = null;
    $filter = $('div').class('filter');
    constructor() {
        super('searchbar');
        this.build();
        window.addEventListener('keyup', (e) => {
            if (!this.inDOM() && e.key === '/') this.activate();
            if (this.inDOM() && e.key === 'Escape') this.inactivate(); 
        })
    }

    private build() {
        this
        .content([
            $('div').class('input-container')
                .content([
                    this.$tagInput
                        .on('input', () => this.inputHandler())
                        .on('keydown', (e) => this.keyHandler(e)),
                    $('ion-icon').name('close-circle-outline').title('Clear Input')
                        .on('click', () => this.$tagInput.clearAll())
                ])
                .on('click', (e) => {
                    if (e.target === this.$tagInput.dom) this.$tagInput.addTag().input();
                }),
            $('div').class('selection-list-container').content([
                this.$selectionList
            ]),
            this.$filter.on('click', () => {
                if (location.hash === '#search') $.back();
            })
        ])
    }

    activate() {
        this.hide(false);
        this.$filter
            .animate({
                opacity: [0, 0.5]
            }, { duration: 300, easing: 'ease'})
        this.$tagInput.input();
        return this;
    }

    inactivate() {
        this.animate({
            opacity: [0.5, 0]
        }, { duration: 300, easing: 'ease'}, () => this.hide(true))
        return this;
    }

    private keyHandler(e: KeyboardEvent) {
        const addTag = () => {e.preventDefault(); this.$tagInput.addTag().input()}
        const addSelectedTag = ($selection: $Selection) => {
            const inputIndex = this.$tagInput.children.indexOf(this.$tagInput.$inputor);
            const nextTag = this.$tagInput.children.array.at(inputIndex + 1) as $Tag;
            this.$tagInput.addTag($selection.value());
            if (nextTag) this.$tagInput.editTag(nextTag);
            else this.$tagInput.input();
        }
        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault();
                this.$selectionList.focusPrevSelection();
                this.$tagInput.value(this.$selectionList.focused?.value());
                break;
            }
            case 'ArrowDown': {
                e.preventDefault();
                this.$selectionList.focusNextSelection();
                this.$tagInput.value(this.$selectionList.focused?.value());
                break;
            }
            case ' ': addTag(); break;
            case 'Enter': {
                e.preventDefault();
                if (this.$selectionList.focused) addSelectedTag(this.$selectionList.focused);
                else {
                    this.$tagInput.addTag();
                    this.search();
                }
                break;
            }
            case 'Tab': {
                e.preventDefault();
                const inputIndex = this.$tagInput.children.indexOf(this.$tagInput.$inputor)
                if (e.shiftKey) {
                    this.$tagInput.editTag(this.$tagInput.children.array.at(inputIndex - 1) as $Tag)
                    break;
                }
                if (this.$selectionList.focused) addSelectedTag(this.$selectionList.focused);
                else {
                    const nextTag = this.$tagInput.children.array.at(inputIndex + 1) as $Tag;
                    if (nextTag) this.$tagInput.editTag(nextTag);
                    else this.$tagInput.addTag().input();
                }
                break;
            }
            case 'Backspace': {
                const inputIndex = this.$tagInput.children.indexOf(this.$tagInput.$inputor)
                if (inputIndex !== 0 && !this.$tagInput.$input.value().length) {
                    e.preventDefault();
                    this.$tagInput.editTag(this.$tagInput.children.array.at(inputIndex - 1) as $Tag)
                }
                break;
            }
        }
    }

    private inputHandler() {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        this.typingTimer = setTimeout(async() => {
            this.typingTimer = null;
            this.getSearchSuggestions();
        }, 200);
    }

    async getSearchSuggestions() {
        const input = this.$tagInput.$input.value()
        if (!input.length) return this.$selectionList.clearSelections();
        const tags = await Tag.fetchMultiple(Booru.used, {fuzzy_name_matches: input, order: 'similarity'});
        this.$selectionList
            .clearSelections()
            .addSelections(tags.map(tag => new $Selection().value(tag.name)
                .content([
                    $('span').class('tag-name').content(tag.name),
                    $('span').class('tag-category').content(TagCategory[tag.category])
                ])
                .on('click', () => {this.$tagInput.addTag(tag.name).input()})
            ))
        if (!this.$tagInput.$input.value().length) this.$selectionList.clearSelections();
    }

    search() {
        $.replace(`/posts?tags=${this.$tagInput.query}`);
        this.$tagInput.clearAll();
        this.inactivate();
        return this;
    }

    checkURL(beforeURL: URL, afterURL: URL) {
        if (beforeURL.hash === '#search') this.inactivate();
        if (afterURL.hash === '#search') this.activate();
    }
}

class $SelectionList extends $Container {
    focused: $Selection | null = null;
    selections = new Set<$Selection>();
    constructor() {
        super('selection-list');
    }

    addSelections(selections: OrArray<$Selection>) {
        selections = $.orArrayResolve(selections);
        for (const $selection of selections) {
            this.selections.add($selection);
        }
        this.insert(selections);
        return this;
    }

    clearSelections() {
        this.focused = null;
        this.selections.clear();
        this.clear();
        return this;
    }

    focusSelection(selection: $Selection) {
        this.blurSelection();
        this.focused = selection;
        selection.focus();
        return this;
    }

    blurSelection() {
        this.focused?.blur();
        this.focused = null;
        return this;
    }

    focusNextSelection() {
        const selections = this.selections.array;
        const first = selections.at(0);
        if (this.focused) {
            const next = selections.at(selections.indexOf(this.focused) + 1);
            if (next) this.focusSelection(next);
            else if (first) this.focusSelection(first);
        } else if (first) this.focusSelection(first);
    }

    focusPrevSelection() {
        const selections = this.selections.array;
        if (this.focused) {
            const next = selections.at(selections.indexOf(this.focused) - 1);
            if (next) this.focusSelection(next);
        } else {
            const next = selections.at(0);
            if (next) this.focusSelection(next);
        }
    }
}

class $Selection extends $Container {
    private property = {
        value: ''
    }
    constructor() {
        super('selection');
    }

    value(): string;
    value(value: string): this;
    value(value?: string) { return $.fluent(this, arguments, () => this.property.value, () => $.set(this.property, 'value', value))}

    focus() {
        this.addClass('active');
        return this;
    }

    blur() {
        this.removeClass('active');
        return this;
    }
}

class $TagInput extends $Container {
    $input = $('input').type('text');
    $sizer = $('span').class('sizer');
    $inputor = $('div').class('input-wrapper').content([
        this.$sizer,
        this.$input
            .on('input', () => { 
                this.$sizer.content(this.$input.value());
            })
    ])
    tags = new Set<$Tag>();
    $seachbar: $Searchbar
    constructor($seachbar: $Searchbar) {
        super('tag-input');
        this.$seachbar = $seachbar;
    }

    input() {
        this.insert(this.$inputor);
        this.$input.focus();
        if (this.$input.value()) this.$seachbar.getSearchSuggestions();
        else this.$seachbar.$selectionList.clearSelections();
        return this;
    }

    addTag(tagName?: string) {
        tagName = tagName ?? this.$input.value();
        if (!tagName.length) return this;
        const $tag = new $Tag(tagName);
        $tag.on('click', () => this.editTag($tag))
        this.tags.add($tag);
        this.value('');
        this.$inputor.replace($tag);
        return this;
    }

    editTag($tag: $Tag) {
        this.addTag();
        this.tags.delete($tag);
        $tag.replace(this.$inputor);
        this.value($tag.name);
        this.$input.focus();
        this.$seachbar.getSearchSuggestions();
        return this;
    }

    clearAll() {
        this.value('');
        this.tags.clear();
        this.clear();
        return this;
    }

    value(value?: string) {
        if (value === undefined) return this;
        this.$input.value(value);
        this.$sizer.content(value);
        return this;
    }

    get query() { return this.tags.array.map(tag => tag.name).toString().replace(',', '+') }
}

class $Tag extends $Container {
    name: string;
    constructor(name: string) {
        super('tag');
        this.name = name;
        this.build();
    }

    private build() {
        this.content(this.name)
    }
}