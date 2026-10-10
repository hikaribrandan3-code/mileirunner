// One simulation and the same track templates; only tuning differs.
export const DIFFICULTIES=Object.freeze({
 easy:Object.freeze({start:15,max:28,acceleration:.075,chaseAt:15,meterStart:10,hit:10,meterRate:2.4,meterRamp:.012,meterExtra:1.9,recovery:.65,hitGap:3.2,catchGap:5.0,chainGrace:2.0,powerMin:9,powerMax:12}),
 medium:Object.freeze({start:18,max:32,acceleration:.09,chaseAt:13,meterStart:15,hit:14,meterRate:2.8,meterRamp:.014,meterExtra:2.25,recovery:.45,hitGap:3.2,catchGap:4.6,chainGrace:1.65,powerMin:10,powerMax:13}),
 hard:Object.freeze({start:20,max:35,acceleration:.11,chaseAt:11,meterStart:20,hit:18,meterRate:3.2,meterRamp:.016,meterExtra:2.6,recovery:.28,hitGap:3.2,catchGap:4.25,chainGrace:1.3,powerMin:11,powerMax:15})
});
export const difficultyAt=id=>DIFFICULTIES[id]||DIFFICULTIES.medium;
export const SHOWCASE=Object.freeze({milei:['rescue','afuera','lion'],trump:['gas','burger','ham'],bibi:['chosen','speech','bibi'],ben:['chickenflight','presspanic','bigben']});
// Flight had four slots out of ten in the former weighted pool (40%).
// Double the flight share after the opening showcase; repeats are intentional.
export const FLIGHT_PICKUP_CHANCE=.8;
export function chooseRandomPower(character,lastPower,random){
 const flight=SHOWCASE[character.id][0];
 if(random()<FLIGHT_PICKUP_CHANCE)return flight;
 const pool=[...character.powers.filter(id=>id!==flight),'magnet','magnet','dollars'];
 if(character.id==='ben')pool.push('chicken','chicken');
 const available=pool.filter(id=>id!==lastPower);
 return available[Math.floor(random()*available.length)];
}
