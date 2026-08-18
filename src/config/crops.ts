import type { CropConfig } from '../types';

export const CROPS: CropConfig[] = [
  {id:'wheat',name:'Lúa mì',emoji:'🌾',level:1,seedCost:5,growMinutes:2,baseYield:3,sellPrice:3,exp:2,waterToleranceHours:36,diseaseRisk:.02,category:'ruộng',colors:['#82b440','#e7c85d']},
  {id:'carrot',name:'Cà rốt',emoji:'🥕',level:1,seedCost:8,growMinutes:4,baseYield:3,sellPrice:5,exp:3,waterToleranceHours:34,diseaseRisk:.025,category:'ruộng',colors:['#55a84f','#f28734']},
  {id:'corn',name:'Bắp',emoji:'🌽',level:2,seedCost:16,growMinutes:8,baseYield:4,sellPrice:7,exp:5,waterToleranceHours:36,diseaseRisk:.03,category:'ruộng',colors:['#6fac45','#f5ca3b']},
  {id:'soybean',name:'Đậu nành',emoji:'🫘',level:3,seedCost:20,growMinutes:12,baseYield:4,sellPrice:9,exp:6,waterToleranceHours:34,diseaseRisk:.03,category:'ruộng',colors:['#5f9c41','#b8c858']},
  {id:'potato',name:'Khoai tây',emoji:'🥔',level:4,seedCost:34,growMinutes:18,baseYield:4,sellPrice:13,exp:8,waterToleranceHours:38,diseaseRisk:.035,category:'ruộng',colors:['#55964a','#b98a58']},
  {id:'lettuce',name:'Xà lách',emoji:'🥬',level:5,seedCost:38,growMinutes:20,baseYield:5,sellPrice:11,exp:9,waterToleranceHours:28,diseaseRisk:.04,category:'ruộng',colors:['#5cae50','#95cc69']},
  {id:'tomato',name:'Cà chua',emoji:'🍅',level:6,seedCost:55,growMinutes:28,baseYield:5,sellPrice:16,exp:11,waterToleranceHours:30,diseaseRisk:.05,category:'ruộng',colors:['#4c9e49','#db493f']},
  {id:'sweet_potato',name:'Khoai lang',emoji:'🍠',level:7,seedCost:70,growMinutes:35,baseYield:5,sellPrice:20,exp:12,waterToleranceHours:38,diseaseRisk:.035,category:'ruộng',colors:['#5d9848','#8d4b65']},
  {id:'cabbage',name:'Bắp cải',emoji:'🥬',level:8,seedCost:84,growMinutes:42,baseYield:4,sellPrice:28,exp:14,waterToleranceHours:32,diseaseRisk:.04,category:'ruộng',colors:['#5d9f55','#abc18a']},
  {id:'onion',name:'Hành tây',emoji:'🧅',level:9,seedCost:95,growMinutes:48,baseYield:5,sellPrice:25,exp:15,waterToleranceHours:36,diseaseRisk:.035,category:'ruộng',colors:['#559b4a','#d6b89b']},
  {id:'bell_pepper',name:'Ớt chuông',emoji:'🫑',level:10,seedCost:120,growMinutes:58,baseYield:5,sellPrice:31,exp:17,waterToleranceHours:30,diseaseRisk:.045,category:'ruộng',colors:['#5aa14a','#df4f43']},
  {id:'pumpkin',name:'Bí đỏ',emoji:'🎃',level:11,seedCost:160,growMinutes:75,baseYield:4,sellPrice:50,exp:21,waterToleranceHours:40,diseaseRisk:.03,category:'ruộng',colors:['#4b9348','#e98c2c']},
  {id:'strawberry',name:'Dâu tây',emoji:'🍓',level:12,seedCost:190,growMinutes:90,baseYield:5,sellPrice:52,exp:23,waterToleranceHours:28,diseaseRisk:.055,category:'ruộng',colors:['#4f9e49','#e64a52']},
  {id:'watermelon',name:'Dưa hấu',emoji:'🍉',level:13,seedCost:240,growMinutes:115,baseYield:4,sellPrice:78,exp:27,waterToleranceHours:34,diseaseRisk:.04,category:'ruộng',colors:['#4a9244','#3b7f4f']},
  {id:'sugarcane',name:'Mía',emoji:'🎋',level:14,seedCost:270,growMinutes:140,baseYield:5,sellPrice:72,exp:29,waterToleranceHours:44,diseaseRisk:.025,category:'ruộng',colors:['#629c47','#a8c95b']},
  {id:'pineapple',name:'Dứa',emoji:'🍍',level:15,seedCost:340,growMinutes:180,baseYield:4,sellPrice:105,exp:34,waterToleranceHours:40,diseaseRisk:.03,category:'vườn',colors:['#5f9345','#dda83a']},
  {id:'grape',name:'Nho',emoji:'🍇',level:16,seedCost:420,growMinutes:220,baseYield:5,sellPrice:104,exp:38,waterToleranceHours:32,diseaseRisk:.05,category:'vườn',colors:['#559348','#77509a']},
  {id:'orange',name:'Cam',emoji:'🍊',level:17,seedCost:520,growMinutes:280,baseYield:5,sellPrice:125,exp:44,waterToleranceHours:42,diseaseRisk:.03,category:'vườn',colors:['#4f8d44','#e8972f']},
  {id:'apple',name:'Táo',emoji:'🍎',level:18,seedCost:650,growMinutes:360,baseYield:5,sellPrice:150,exp:50,waterToleranceHours:44,diseaseRisk:.03,category:'vườn',colors:['#4d8d46','#d94b43']},
  {id:'mango',name:'Xoài',emoji:'🥭',level:20,seedCost:850,growMinutes:480,baseYield:5,sellPrice:185,exp:60,waterToleranceHours:46,diseaseRisk:.025,category:'vườn',colors:['#558e43','#e5b43d']}
];

export const cropById = Object.fromEntries(CROPS.map(c => [c.id, c])) as Record<string, CropConfig>;
