export interface Point { x:number; z:number; id?:string }
export interface Room { id:string; name:string; points:Point[]; color:string }
export interface WallOwner { roomId:string; edge:number; start:number; end:number }
export interface Wall { id:string; a:Point; b:Point; length:number; thickness:number; roomIds:string[]; owners:WallOwner[]; profileId:string }
export interface Opening { id:string; wallId:string; kind:'door'|'window'; offset:number; width:number; height:number; sill:number }
export interface Material { color:string; roughness:number; metalness:number; opacity:number; textureAssetId?:string; textureScale?:number }
export interface StockUnit { id:string; name:string; length:number; enabled:boolean }
export interface MasonryProfile { id:string; name:string; kind:'aac'|'brick'; length:number; width:number; height:number; horizontalJoint:number; verticalJoint:number; kerf:number; stock:StockUnit[] }
export type FurnitureKind='wardrobe'|'shelf'|'cabinet'|'table'|'sofa'|'bed'|'asset';
export interface FurnitureInstance { id:string; name:string; kind:FurnitureKind; x:number; z:number; y:number; rotation:number; width:number; depth:number; height:number; shelves:number; sections:number; board:number; material:Material; partMaterials:Record<string,Material>; shelfPositions:number[]; visible:boolean; useSourceMaterials?:boolean; assetId?:string }
export interface LayoutVariant { id:string; name:string; furniture:FurnitureInstance[] }
export interface LightDefinition { id:string; name:string; type:'point'|'spot'; x:number;y:number;z:number; targetX:number;targetY:number;targetZ:number; color:string; intensity:number; angle:number }
export interface ProjectDocument { schemaVersion:1; catalogAssetIds?:string[]; id:string; name:string; revision:number; height:number; rooms:Room[]; openings:Opening[]; profiles:MasonryProfile[]; exteriorProfileId:string; interiorProfileId:string; variants:LayoutVariant[]; activeVariantId:string; architectureLocked:boolean; lighting:{sun:number;fill:number;azimuth:number;altitude:number;lights:LightDefinition[];hdriAssetId?:string}; createdAt:string; updatedAt:string }
export interface AssetStats { triangles:number; vertices:number; meshes:number; materials:number; textures:number; texturePixels:number; estimatedBytes:number; bounds:[number,number,number]; processingMs:number }
export interface AssetRecord { id:string; name:string; kind:'model'|'hdri'|'texture'; originals:{name:string;blob:Blob}[]; glb?:Blob; lowGlb?:Blob; thumbnail?:Blob; stats?:AssetStats; warnings:string[] }
export interface MasonryPiece { footprint:Point[];id:string;wallId:string;row:number;start:number;length:number;y:number;height:number;profileId:string;stockId:string;stockIndex:number;cut:boolean }
export interface MasonryIssue { wallId:string;row?:number;message:string;rule:string }
export interface StockUse { id:number;profileId:string;stockId:string;length:number;used:number;kerf:number;remaining:number;pieceIds:string[] }
export interface MasonryResult { pieces:MasonryPiece[];stock:StockUse[];issues:MasonryIssue[];complete:boolean;revision:number;elapsedMs:number }
