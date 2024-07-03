export interface TokenInfoDto {
	price: ItemWithChange;
	marketCap: ItemWithChange;
	volume: number;
	apr: number;
}

export interface ItemWithChange {
	value: number;
	change: number;
}