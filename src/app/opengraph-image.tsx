import { ImageResponse } from 'next/og';
export const alt = 'Sun Direction — find the shadier side of your bus or train';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',background:'#214f3d',color:'white',padding:80,flexDirection:'column',justifyContent:'space-between'}}><div style={{display:'flex',fontSize:32,color:'#efc453'}}>sun direction.</div><div style={{display:'flex',fontSize:76,fontWeight:700,maxWidth:950}}>A better seat. Less direct sun.</div><div style={{display:'flex',fontSize:30,color:'#e5f0e7'}}>Bus & train routes · Departure time · Sun compass</div></div>, size);
}
