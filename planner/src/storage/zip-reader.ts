import {Inflate,strFromU8} from 'fflate';
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
/** Classic ZIP only. Bound actual DEFLATE output, not just attacker-supplied sizes. */
export function readZip(bytes:Uint8Array,maxBytes:number):Record<string,Uint8Array>{
 const fail=(message='Повреждённый архив'):never=>{throw new Error(message);};
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||bytes.length>maxBytes)fail('Слишком большой размер архива для доступной памяти');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0)fail();const count=view.getUint16(end+10,true),start=view.getUint32(end+16,true),directorySize=view.getUint32(end+12,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||count>30000||start+directorySize!==end)fail('Неподдерживаемый каталог ZIP');
 const entries:{name:string;size:number;compressed:number;offset:number;method:number;crc:number}[]=[],names=new Set<string>();let pos=start,declared=0;
 for(let i=0;i<count;i++){
  if(pos+46>end||view.getUint32(pos,true)!==0x02014b50)fail();const flags=view.getUint16(pos+8,true),method=view.getUint16(pos+10,true),crc=view.getUint32(pos+16,true),compressed=view.getUint32(pos+20,true),size=view.getUint32(pos+24,true),n=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true),local=view.getUint32(pos+42,true);
  if(flags&0x41||![0,8].includes(method)||pos+46+n+extra+comment>end||view.getUint16(pos+34,true))fail('Неподдерживаемое сжатие ZIP');
  const name=strFromU8(bytes.subarray(pos+46,pos+46+n));if(!name||name.includes('..')||name.startsWith('/')||name.includes('\\')||name.includes('\0')||['__proto__','constructor','prototype'].some(part=>name.split('/').includes(part))||names.has(name))fail('Недопустимый или повторяющийся путь');names.add(name);declared+=size;if(declared>maxBytes)fail('Распакованный размер превышает доступный бюджет памяти');
  if(local+30>start||view.getUint32(local,true)!==0x04034b50||view.getUint16(local+6,true)!==flags||view.getUint16(local+8,true)!==method)fail();const localName=view.getUint16(local+26,true),localExtra=view.getUint16(local+28,true),offset=local+30+localName+localExtra;
  if(offset+compressed>start||strFromU8(bytes.subarray(local+30,local+30+localName))!==name)fail();if(!(flags&8)&&(view.getUint32(local+14,true)!==crc||view.getUint32(local+18,true)!==compressed||view.getUint32(local+22,true)!==size))fail();
  entries.push({name,size,compressed,offset,method,crc});pos+=46+n+extra+comment;
 }
 if(pos!==end)fail();const ranges=entries.map(e=>[e.offset,e.offset+e.compressed]).sort((a,b)=>a[0]-b[0]);if(ranges.some((r,i)=>i&&r[0]<ranges[i-1][1]))fail();
 const files:Record<string,Uint8Array>=Object.create(null);let actual=0;
 for(const entry of entries){let length=0,crc=0xffffffff,finished=false;const chunks:Uint8Array[]=[];const accept=(chunk:Uint8Array,final:boolean)=>{length+=chunk.length;actual+=chunk.length;if(length>entry.size||actual>maxBytes)fail('Фактический размер распаковки превышает заявленный размер или бюджет памяти');for(const byte of chunk)crc=crcTable[(crc^byte)&255]^(crc>>>8);chunks.push(chunk);finished=final;};
  const source=bytes.subarray(entry.offset,entry.offset+entry.compressed);
  if(entry.method===0)accept(source,true);else{const inflate=new Inflate(accept);if(!source.length)fail();for(let i=0;i<source.length;i+=4096)inflate.push(source.subarray(i,i+4096),i+4096>=source.length);}
  if(!finished||length!==entry.size||((crc^0xffffffff)>>>0)!==entry.crc)fail('Контрольная сумма или размер файла не совпадают');const result=new Uint8Array(length);let cursor=0;for(const chunk of chunks){result.set(chunk,cursor);cursor+=chunk.length;}files[entry.name]=result;
 }
 return files;
}
