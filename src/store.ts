import {Server} from "./server.ts";
import {useSyncExternalStore} from "react";
import {Indexable, Item, Settings, SETTINGS_DEFAULT, State} from "./types.ts";
import mergeDeep from "./tools.ts";

class Store<T> {

    public data: T

    constructor(private id: string, initialData: T, private saveToDisk: boolean = true, public listeners: ((data: T) => void)[] = []) {
        const init = JSON.parse(JSON.stringify(initialData));
        if (!saveToDisk) {
            this.data = init;
        }

        const item = localStorage.getItem(this.id);
        if (item) {
            this.data = mergeDeep(init, JSON.parse(item));
        } else {
            this.data = init;
        }
    }

    asState(): T {
        return useSyncExternalStore(this.subscribe.bind(this), this.getSnapshot.bind(this))
    }

    update(data: T) {
        this.data = data;
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
}


class ArrayStore<A extends Item> extends Store<Array<A>> {

    updateItem(data: A) {
        const copy = [...this.data];
        const index = copy.findIndex(d => d.id == data.id);
        if (index !== -1) {
            copy[index] = data;
            this.update(copy);
        } else {
            this.addItem(data);
        }
    }

    addItem(data: A) {
        this.update([...this.data, data]);
    }

    removeItem(data: A) {
        this.update([...this.data.filter(s => s.id != data.id)]);
    }

    removeItemAt(index: number) {
        const copy = [...this.data];
        copy.splice(index, 1);
        this.update(copy);
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
