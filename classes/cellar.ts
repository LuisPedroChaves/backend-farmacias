import { ICellar } from "../models/cellar";


export class Cellar {

    public id: string;
    public name: string;

    constructor(id: string) {
        this.id = id;
        this.name = 'SIN-NOMBRE';
    }
}