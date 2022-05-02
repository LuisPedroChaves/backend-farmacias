import { Cellar } from './cellar';

export class ListCellars {
    private list: Cellar[] = [];

    constructor() { }

    // Agregar una sucursal
    public add(cellar: Cellar) {
        this.list.push(cellar);
        console.log(this.list);
        return cellar;
    }

    public updateName(id: string, name: string) {
        for (let cellar of this.list) {
            if (cellar.id === id) {
                cellar.name = name;
                break;
            }
        }
        console.log(this.list);
    }

    public getCellars() {
        return this.list;
    }

    public getCellar(id: string) {
        return this.list.find(cellar => cellar.id === id)
    }

    public deleteCellar(id: string) {
        this.list = this.list.filter(cellar => cellar.id !== id);
        console.log(this.list);
        return id;
    }

}