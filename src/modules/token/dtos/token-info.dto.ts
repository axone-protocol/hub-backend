export interface TokenInfoDto {
	price: ItemWithChange;
	marketCap: ItemWithChange;
	volume: number;
	apr: string;
}

export interface ItemWithChange {
	value: number;
	change: number;
}