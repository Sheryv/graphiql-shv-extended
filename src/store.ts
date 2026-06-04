import {Server} from "./server.ts";
import {useSyncExternalStore} from "react";
import {Indexable, Item, Settings, SETTINGS_DEFAULT, State} from "./types.ts";
import mergeDeep from "./tools.ts";

class Store<T extends Indexable> {

    public data: T

    constructor(private id: string, initialData: T, private saveToDisk: boolean = true, public listeners: ((data: T) => void)[] = []) {
        const init = JSON.parse(JSON.stringify(initialData));
        if (!saveToDisk) {
            this.data = init;
        } else {
            const item = localStorage.getItem(this.id);
            if (item) {
                let res = this.mergeDataFromDisk(JSON.parse(item), init);
                this.data = res;
            } else {
                this.data = init;
            }
        }
    }

    asState(): T {
        return useSyncExternalStore(this.subscribe.bind(this), this.getSnapshot.bind(this))
    }

    set(data: T) {
        this.data = data;
        this.emitChange()
    }

    setSome(data: Partial<T>) {
        this.data = Object.assign(Object.assign({}, this.data), data);
        this.emitChange()
    }

    update(fn: (data: T) => T) {
        this.data = fn(this.data);
        this.emitChange()
    }

    subscribe(listener: (data: T) => void) {
        this.listeners = [...this.listeners, listener];
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    getSnapshot(): T {
        return this.data;
    }

    private emitChange() {
        if (this.saveToDisk) {
            localStorage.setItem(this.id, JSON.stringify(this.data));
        }
        const d = this.data
        for (let listener of this.listeners) {
            listener(d);
        }
    }

    protected mergeDataFromDisk(data: T, initialData: T): T {
        return mergeDeep(initialData, data);
    }
}


class ArrayStore<A extends Item> extends Store<Array<A>> {

    updateItem(data: A) {
        const copy = [...this.data];
        const index = copy.findIndex(d => d.id == data.id);
        if (index !== -1) {
            copy[index] = data;
            this.set(copy);
        } else {
            this.addItem(data);
        }
    }

    addItem(data: A) {
        this.set([...this.data, data]);
    }

    removeItem(data: A) {
        this.set([...this.data.filter(s => s.id != data.id)]);
    }

    removeItemAt(index: number) {
        const copy = [...this.data];
        copy.splice(index, 1);
        this.set(copy);
    }

    protected mergeDataFromDisk(data: Array<A>, initialData: Array<A>): Array<A> {
        for (let i = 0; i < data.length; i++) {
            const found = initialData.find(e => e.id == data[i].id)
            if (found) {
                data[i] = mergeDeep(found, data[i]);
            }
        }
        return data;
    }
}


const initial = [
    new Server('Nasa', 'https://graphql.earthdata.nasa.gov/api'),
    new Server('Yelp', 'https://docs.developer.yelp.com/graphql')

]

export const STORE_SERVERS = new ArrayStore<Server>('graphiql-extended:server_list', initial)
export const STORE_SELECTED = new Store<Server>('graphiql-extended:selected_server', STORE_SERVERS.getSnapshot()[0])
export const STORE_SETTINGS = new Store<Settings>('graphiql-extended:settings', SETTINGS_DEFAULT)
export const STORE_STATUS = new Store<State>('graphiql-extended:status', {}, false)
