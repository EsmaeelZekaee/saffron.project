export interface LoadPdfEvent {
    pages: number
}

export interface FabricSelectEvent {
    id: string,
    left: number
    top: number,
    width: number,
    height: number
}

export interface FabricMovingEvent {
    id: string,
    left: number
    top: number,
    width: number,
    height: number
}

export interface FabricModifiedEvent {
    id: string,
    left: number
    top: number,
    width: number,
    height: number
}