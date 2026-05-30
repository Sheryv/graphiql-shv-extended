import {Server} from "./server.ts";
import {useSyncExternalStore} from "react";
import {Item} from "./item.ts";

class Store<T> {

    public data: T

    constructor(private id: string, initialData: T, public listeners: ((data: T) => void)[] = []) {
        const item = localStorage.getItem(this.id);
        if (item) {
            this.data = JSON.parse(item);
        } else {
            this.data = initialData;
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
        localStorage.setItem(this.id, JSON.stringify(this.data));
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

export const STORE_SERVERS = new ArrayStore<Server>('server_list', initial)
export const STORE_SELECTED = new Store<Server>('selected_server', STORE_SERVERS.getSnapshot()[0])
