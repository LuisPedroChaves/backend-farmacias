import { ICellar } from "../models/cellar";


export class Cellar {

    public id: string;
    public name: string;
    public sala: string;

    constructor(id: string) {
        this.id = id;
        this.name = 'SIN-NOMBRE';
        this.sala = 'SIN-SALA';
    }
}