import { Observable, fromEvent } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, map } from "rxjs/operators";

const searchElement: HTMLInputElement = document.querySelector('#search') as HTMLInputElement;
let items: GithubSearchItem[] = [];
let totalCount: number;

export class GithubSearch {

    public searchText(): void {
        const sequence$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(searchElement, 'keyup');
        this.search(sequence$)
            .subscribe((data) => {
                console.log('data', data);
                totalCount = data['total_count'] as number;
                items = data['items'] as GithubSearchItem[];

                this.renderCount();
                this.renderItems();
            });
    }

    private search(source$: Observable<KeyboardEvent>): Observable<any> {
        return source$.pipe(
            // Не хочется делать запрос на каждое нажатие, не слать Event
            // Хочется иметь возможность слегка задержать и быстрые нажатия отложить
            debounceTime(300),
            // Если пользователь вводил и вернулся к исходному значению
            // То есть не изменил свой ввод
            distinctUntilChanged(),
            map((event: KeyboardEvent) => (event.target as HTMLInputElement).value),
            // Этот оператор отменит все запросы кроме последнего
            switchMap((text: string) => this.request(text))
        );
    }

    private request(inputText: string): Promise<Response> {
        return fetch(`https://api.github.com/search/repositories?q=${inputText}`)
            .then((res) => {
                return res.json();
            });
    }

    private renderItems(): void {
        console.log('items', items);

        const itemsElement = document.querySelector('#items') as HTMLDivElement;
        let itemsElementHtml = '';
        for (let i = 0; i < items.length; i++) {
            itemsElementHtml += `
            <li><a data-id="${items[i].id}" href="${items[i].html_url}">
                <span>Name: ${items[i].name}</span>
                <br/>
                <span>Language: ${items[i].language}</span>
                <br/>
                <span>Description: ${items[i].description}</span>
            </a></li>`;
        }
        itemsElement.innerHTML = itemsElementHtml;
    }

    private renderCount(): void {
        console.log('totalCount', totalCount);

        const countElement = document.querySelector('#count') as HTMLDivElement;
        console.log('countElement', countElement);

        countElement.innerText = `Count: ${totalCount}`;
    }
}

class GithubSearchItem {
    constructor(
        public id: number,
        public description: string,
        public language: string,
        public name: string,
        public html_url: string
    ) {}
}

const githubSearch = new GithubSearch();
githubSearch.searchText();
