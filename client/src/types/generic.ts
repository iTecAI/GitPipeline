import { ApiResponse, get } from "../utils/api";

export type PaginationResult<T> = {
    count: number;
    pages: number;
    current_page: number;
    page_content: T[];
    previous: string | null;
    next: string | null;
};

export class Pagination<T> {
    private cache: { [key: string]: T[] };

    private constructor(
        public total: number,
        public pages: number,
        public currentPage: number,
        public content: T[],
        public next: string | null,
        public previous: string | null,
        private url: string
    ) {
        this.cache = {};
        this.cache[currentPage.toString()] = content;
    }

    public static async paginate<T>(
        endpoint: string,
        additional_query?: { [key: string]: any }
    ): Promise<Pagination<T>> {
        const result: ApiResponse<PaginationResult<T>> = await get<
            PaginationResult<T>
        >(endpoint, { query: { page: 0, ...(additional_query ?? {}) } });
        if (!result.success) {
            throw result;
        }
        return new Pagination<T>(
            result.data.count,
            result.data.pages,
            result.data.current_page,
            result.data.page_content,
            result.data.next,
            result.data.previous,
            endpoint
        );
    }

    private update(result: PaginationResult<T>): void {
        this.total = result.count;
        this.pages = result.pages;
        if (result.current_page !== this.currentPage) {
            this.currentPage = result.current_page;
        }
        this.content = result.page_content;
        this.next = result.next;
        this.previous = result.previous;
        this.cache[result.current_page.toString()] = result.page_content;
    }

    public async nextPage(additional_query?: {
        [key: string]: any;
    }): Promise<T[]> {
        if (this.next === null) {
            throw new Error("Currently on last page");
        }
        this.currentPage = this.currentPage + 1;
        if (
            Object.keys(this.cache).includes((this.currentPage + 1).toString())
        ) {
            this.content = this.cache[(this.currentPage + 1).toString()];
        }
        const result: ApiResponse<PaginationResult<T>> = await get<
            PaginationResult<T>
        >(this.next, { query: additional_query ?? undefined });
        if (!result.success) {
            throw result;
        }
        this.update(result.data);
        return this.content;
    }

    public async prevPage(additional_query?: {
        [key: string]: any;
    }): Promise<T[]> {
        if (this.previous === null) {
            throw new Error("Currently on first page");
        }
        this.currentPage = this.currentPage - 1;
        if (
            Object.keys(this.cache).includes((this.currentPage - 1).toString())
        ) {
            this.content = this.cache[(this.currentPage - 1).toString()];
        }
        const result: ApiResponse<PaginationResult<T>> = await get<
            PaginationResult<T>
        >(this.previous, { query: additional_query ?? undefined });
        if (!result.success) {
            throw result;
        }
        this.update(result.data);
        return this.content;
    }

    public async toPage(
        page: number,
        additional_query?: {
            [key: string]: any;
        }
    ): Promise<T[]> {
        this.currentPage = page;
        if (Object.keys(this.cache).includes(page.toString())) {
            this.content = this.cache[page.toString()];
        }
        const result: ApiResponse<PaginationResult<T>> = await get<
            PaginationResult<T>
        >(this.url, { query: { page: page, ...(additional_query ?? {}) } });
        if (!result.success) {
            throw result;
        }
        this.update(result.data);
        return this.content;
    }

    public isCached(page: number): boolean {
        return Object.keys(this.cache).includes(page.toString());
    }

    public getCache(page: number): T[] {
        if (this.isCached(page)) {
            return this.cache[page.toString()];
        } else {
            return [];
        }
    }
}
