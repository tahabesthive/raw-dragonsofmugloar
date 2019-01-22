const fetch = require('node-fetch');
const Bluebird = require('bluebird');

let urlApi = 'https://dragonsofmugloar.com/api/v2/';
let gameInfo = {
    gameId: '',
    lives: 0,
    gold: 0,
    level: 0,
    score: 0,
    highScore: 0,
    turn: 0
}

const getData = async (url,method,data) => {
    let objectjson = false;
    try {
      const response = await fetch(url,{ method: method });
      return  await response.json();
    } catch (error) {
      return error;
    }
}

const updateData = async (data,type) =>{
    let list = ['gameId','lives','gold','level','score','highScore','turn'];
    Object.keys(data).forEach(function(key) {
        if ( key in data ) {
            gameInfo[key] = data[key]
        }
    });

    if(type == 'game'){
        console.log('Game Started Game ID : ' + gameInfo.gameId);
    }   

    if(type == 'items') gameInfo['items'] = data
    if(type == 'problems') gameInfo['problems'] = data
    if(type == 'solve') {
        gameInfo.fail = data.success;
            if(data.message) console.log('========================================================');
            if(data.message) console.log(data.message);
            console.log('========================================================');
            console.log('Lives : ' + gameInfo.lives,'Gold :'+ gameInfo.gold,'Score :'+ gameInfo.score,'Turn :'+ gameInfo.turn)
            console.log('========================================================');

    }
}

const selectAutoItem = async () => {
    console.log('Auto Selecting shopping items.');

    if(gameInfo.skip){
        gameInfo.skip = false;
        console.log('skip, didnt buy any item on this turn');
    }else{

    if(gameInfo.lives < 4 && gameInfo.gold > 50 || gameInfo.gold < 150 ){
        list = gameInfo.items.filter(item => item.cost == 50 );
        selectIndex = Math.floor(Math.random() * Math.floor(list.length));
        gameInfo.shopping = list[selectIndex].id;
    }
    if(gameInfo.lives > 3 && gameInfo.gold > 200  && gameInfo.lives < 5 || gameInfo.gold < 300) {
        list = gameInfo.items.filter(item => item.cost > 100 < 300 );
        selectIndex = Math.floor(Math.random() * Math.floor(list.length));
        gameInfo.shopping = list[selectIndex].id;
    }

    if(gameInfo.lives > 5 && gameInfo.gold > 300) {
        list = gameInfo.items.filter(item => item.cost > 101 );
        selectIndex = Math.floor(Math.random() * Math.floor(list.length));
        gameInfo.shopping = list[selectIndex].id;
    }   
    if(typeof list != 'undefined'){
        respone =  await getData(urlApi + gameInfo.gameId+'/shop/buy/'+ gameInfo.shopping,'POST');
        if(!respone.success) gameInfo.skip = true;
        console.log('Buy item : ' + list[selectIndex].name + 'Cost : ' + list[selectIndex].cost);
    }
    }

}
const failDargon = () => {
    console.log('========================================================');
    console.log('Dargon cant able to pass intermedia training.');
    console.log('New Training will start in five second.');
    console.log('========================================================');
}

const selectProblem = async (input) => {
    let selected = [];
    if(gameInfo.skipProblem){
        selected = gameInfo.problems.reduce(
            (record, list) => record.reward > list.reward ? record : list
        );
        gameInfo.skipProblem = false;
    }
    if(!gameInfo.fail || gameInfo.fail == 'undefined'){
        selected = gameInfo.problems.reduce(
            (record, list) => record.reward < list.reward ? record : list
        );
    }else{
        selected = await gameInfo.problems[Math.floor(Math.random() * Math.floor(gameInfo.problems.length))]
    }
    return selected;
}

const keepPlaying = async input => {

    let problemList = await getData(urlApi + gameInfo.gameId+'/messages','GET');
    updateData(await problemList,'problems');
    if(problemList.status){
        failDargon();
        setTimeout(startGame, 5000);
        return false;
    }

    let selectedProblem = await selectProblem();
    let solveStatus = await getData(urlApi + gameInfo.gameId+'/solve/'+ selectedProblem.adId,'POST');
    await updateData(solveStatus,'solve');

    if(solveStatus.error){
        console.log('ad missed, try next');
        gameInfo.skipProblem = true;
        let selectedProblem = await selectProblem();
        let solveStatus = await getData(urlApi + gameInfo.gameId+'/solve/'+ selectedProblem.adId,'POST');
        await updateData(solveStatus,'solve');
    }

    await selectAutoItem();

    if(gameInfo.score > 1000){
        console.log('========================================================');
        console.log('Dargon Succesffully intermedia trained, next training');
        console.log('New Training will start in five second');
        console.log('========================================================');
        setTimeout(startGame, 5000);
        return false;
    }

    keepPlaying();
}


const startGame = async () => {
    gameInfo.skip = false;
    gameInfo.skipProblem = false;

    let init = await getData(urlApi + 'game/start','POST');
    updateData(await init,'game');

    let itemList = await getData(urlApi + gameInfo.gameId+'/shop','GET');
    updateData(await itemList,'items');

    setTimeout(keepPlaying, 2000);
};
  
  
startGame();
