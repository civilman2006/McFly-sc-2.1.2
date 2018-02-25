import increaseTime, { duration } from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';

//import increaseTime, { duration } from './help/increaseTime';
import moment from 'moment';


var Token = artifacts.require("./McFlyToken.sol");
var Crowdsale = artifacts.require("./McFlyCrowd.sol");


contract('Crowdsale', (accounts) => {
    let owner, token, sale;
    let startTimeTLP2, endTimeTLP2, startTimeW1, endTimeW1, startTimeW2, endTimeW2, startTimeW3, endTimeW3, startTimeW4, endTimeW4, startTimeW5, endTimeW5;
    let client1, client2, client3, client4;
    let wallet;
    let wavesAgent;
    let wavesGW;
    let fundMintingAgent;
    let teamWallet;
    let bountyOnlineWallet;
    let bountyOnlineGW;
    let bountyOfflineWallet;
    let advisoryWallet;
    let reservedWallet;
    let airdropWallet;
    let airdropGW;
    let preMcFlyWallet;
    let wavesTokens = 100e24;

    let preMcFlyTotalSupply = 11e24;
    let totalSupply = 1260e24;


    before(async () => {
        owner = web3.eth.accounts[0];
        client1 = web3.eth.accounts[1];
        client2 = web3.eth.accounts[2];
        client3 = web3.eth.accounts[3];
        client4 = web3.eth.accounts[4];

        wallet = web3.eth.accounts[5];
        wavesAgent = web3.eth.accounts[6];
        wavesGW = web3.eth.accounts[7];
        fundMintingAgent = web3.eth.accounts[8];
        teamWallet = web3.eth.accounts[9];
        bountyOnlineWallet = web3.eth.accounts[10];
        bountyOnlineGW = web3.eth.accounts[11];
        bountyOfflineWallet = web3.eth.accounts[12];
        advisoryWallet = web3.eth.accounts[13];
        reservedWallet = web3.eth.accounts[14];
        airdropWallet = web3.eth.accounts[15];
        airdropGW = web3.eth.accounts[16];
        preMcFlyWallet = web3.eth.accounts[17];
    });

    let balanceEqualTo = async (client, should_balance) => {
        let balance;

        balance = await token.balanceOf(client, {from: client});
        assert.equal((balance.toNumber()/1e18).toFixed(4), (should_balance/1e18).toFixed(4), `Token balance should be equal to ${should_balance}`);
    };

    let shouldHaveException = async (fn, error_msg) => {
        let has_error = false;

        try {
            await fn();
        } catch(err) {
            has_error = true;
        } finally {
            assert.equal(has_error, true, error_msg);
        }        

    }

    let check_constant = async (key, value, text) => {
        assert.equal(((await sale[key]()).toNumber()/1e18).toFixed(2), value, text)
    };

    let check_calcAmount = async (ethers, at, totalSupply, should_tokens, should_odd_ethers) => {
        should_tokens = ((should_tokens || 0)/1e18).toFixed(2);
        should_odd_ethers = ((should_odd_ethers || 0)/1e18).toFixed(2);

        let text = `Check MFL ${totalSupply/1e18} MFL + ${ethers/1e18} ETH -> ${should_tokens} MFL`;
        let textOdd = `Check odd ETH ${totalSupply/1e18} MFL + ${ethers/1e18} ETH -> ${should_odd_ethers} ETH`;

        let result = await sale.calcAmountAt(ethers, at, totalSupply);
        let tokens = (result[0].toNumber()/1e18).toFixed(2);
        let odd_ethers = (result[1].toNumber()/1e18).toFixed(2);

        assert.equal(tokens, should_tokens, text);
        assert.equal(odd_ethers, should_odd_ethers, textOdd);
    };

    beforeEach(async function () {
//        startTimeTLP2 = web3.eth.getBlock('latest').timestamp + duration.weeks(1);
        startTimeTLP2 = latestTime() + duration.weeks(1);
        endTimeTLP2 = startTimeTLP2 + duration.days(56);

        startTimeW1 = endTimeTLP2 + duration.days(60);
        endTimeW1 = startTimeW1 + duration.days(12);
        startTimeW2 = endTimeW1 + duration.days(60);
        endTimeW2 = startTimeW2 + duration.days(12);
        startTimeW3 = endTimeW2 + duration.days(60);
        endTimeW3 = startTimeW3 + duration.days(12);
        startTimeW4 = endTimeW3 + duration.days(60);
        endTimeW4 = startTimeW4 + duration.days(12);
        startTimeW5 = endTimeW4 + duration.days(60);
        endTimeW5 = startTimeW5 + duration.days(12);

        sale = await Crowdsale.new(
            startTimeTLP2,
            preMcFlyTotalSupply,
            wallet,
            wavesAgent,
	    wavesGW,
            fundMintingAgent,
            teamWallet,
            bountyOnlineWallet,
            bountyOnlineGW,
            bountyOfflineWallet,
            advisoryWallet,                                                             
            reservedWallet,
	    airdropWallet,
	    airdropGW,
	    preMcFlyWallet
        );
        token = await Token.at(await sale.token());
    })

    it("token.totalSupply -> Check balance and totalSupply before donate", async () => {
        assert.equal((await token.balanceOf(client1)).toNumber(), 0, "balanceOf must be 0 on the start");
        assert.equal((await token.totalSupply()).toNumber(), 651e24, "totalSupply must be 0 on the start"
        );
    });
  
    it("running -> check ITO is started", async() => {
        assert.equal((await sale.running({from: owner})), false);
	let date1 = await sale.startTimeTLP2({from: owner});
	assert.equal(date1, '111');
	assert.equal((await sale.test123()).toNumber(), '111');
//	assert.equal((web3.eth.getBlock('latest').timestamp+duration.weeks(1)), (await sale.test123()));
        assert.equal((await sale.stageName()), 'Not started');
        await increaseTime(duration.days(15));
        assert.equal((await sale.stageName()), 'TLP1.2');
        assert.equal((await sale.running()), true);
    });

    it("running -> check tokens minted to wallets at start", async() => {
/*        _teamTokens = 180e24; // 180,000,000 MFL
        _bountyOnlineTokens = 36e24; // 36,000,000 MFL
        token.allowTransfer(bountyOnlineWallet);
        _bountyOfflineTokens = 54e24; // 54,000,000 MFL
        token.allowTransfer(bountyOfflineWallet);
        _advisoryTokens = 90e24; // 90,000,000 MFL
        _reservedTokens = 162e24; // 162,000,000 MFL
        _airdropTokens = 18e24; // 18,000,000 MFL
        token.allowTransfer(airdropWallet);
*/
        assert.equal((totalSupply/70/1e18*10).toFixed(4), ((await sale.teamTokens())/1e18).toFixed(4), 'team tokens');

        assert.equal((totalSupply/70/1e18*2).toFixed(4), ((await sale.bountyOnlineTokens())/1e18).toFixed(4), 'bounty online tokens');
        assert.equal((totalSupply/70/1e18*2).toFixed(4), ((await token.balanceOf(bountyOnlineWallet))/1e18).toFixed(4), 'bounty online wallet balance');

        assert.equal((totalSupply/70/1e18*3).toFixed(4), ((await sale.bountyOfflineTokens())/1e18).toFixed(4), 'bounty offline tokens');
        assert.equal((totalSupply/70/1e18*3).toFixed(4), ((await token.balanceOf(bountyOfflineWallet))/1e18).toFixed(4), 'bounty offline wallet balance');

        assert.equal((totalSupply/70/1e18*5).toFixed(4), ((await sale.advisoryTokens())/1e18).toFixed(4), 'advisory tokens');

        assert.equal((totalSupply/70/1e18*9).toFixed(4), ((await sale.reservedTokens())/1e18).toFixed(4), 'reserved tokens');

        assert.equal((totalSupply/70/1e18*1).toFixed(4), ((await sale.airdropTokens())/1e18).toFixed(4), 'airdrop tokens');
        assert.equal((totalSupply/70/1e18*1).toFixed(4), ((await token.balanceOf(airdropWallet))/1e18).toFixed(4), 'airdrop wallet balance');

        assert.equal((preMcFlyTotalSupply/1e18).toFixed(4), ((await token.balanceOf(preMcFlyWallet))/1e18).toFixed(4), 'preMcFly wallet balance');
 
        assert.equal((wavesTokens/1e18).toFixed(4), ((await token.balanceOf(wavesAgent))/1e18).toFixed(4), 'waves wallet balance');

        assert.equal((432000000/1e18).toFixed(4), ((await token.balanceOf(owner))/1e18).toFixed(4), 'team wallet balance');
    });
 
    it("calcAmountAt -> TLP2", async() => {
        await check_constant('mintCapInTokens', '1260000000.00');
        await check_constant('hardCapInTokens', '1800000000.00');

         // 0.12 | 1 ETH -> 1 / (100-40) * 100 / 0.2 * 1000 = 8333,3333333333 MFL
         // 0.14 | 1 ETH -> 1 / (100-30) * 100 / 0.2 * 1000 = 7142.8571428571 MFL
         // 0.16 | 1 ETH -> 1 / (100-20) * 100 / 0.2 * 1000 = 6250 MFL
         // 0.18 | 1 ETH -> 1 / (100-10) * 100 / 0.2 * 1000 = 5555,5555555556 MFL
         // 0.20 | 1 ETH -> 1 / (100-0) * 100 / 0.2 * 1000  = 5000 MFL
         // 0.22 | 1 ETH -> 1 / (100+10) * 100 / 0.2 * 1000 = 4545,4545454545 MFL
         // 0.24 | 1 ETH -> 1 / (100+20) * 100 / 0.2 * 1000 = 4166,6666666667 MFL
         // 0.26 | 1 ETH -> 1 / (100+30) * 100 / 0.2 * 1000 = 3846,1538461538 MFL
        await check_calcAmount(1e18, startTimeTLP2, 5555, 8333e18, 0);
//        await check_calcAmount(1e18, startTimeTLP2, 5555, 8333.3333333333e18, 0);
/*        await check_calcAmount(1e18, startTimeTLP2 + duration.days(8), wavesTokens, 7142.8571428571e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(15), wavesTokens, 6250e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(22), wavesTokens, 5555.5555555556e18);
        await check_calcAmount(1e18, startTim4eTLP2 + duration.days(29), wavesTokens, 5000e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(36), wavesTokens, 4545.4545454545e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(43), wavesTokens, 4166.6666666667e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(50), wavesTokens, 3846.1538461538e18);
*/
//        await shouldHaveException(async () => {
//            await check_calcAmount(1e18, startTimeTLP2 + duration.days(57), wavesTokens, 10000e18);
//        }, "Should has an error");
    });

    it("setStartTimeTLP2 -> set and check", async() => {
        let set_start_time_tlp2 = (await sale.SetStartTimeTLP2({fromBlock: 0, toBlock: 'latest'}))

        let time1 = await sale.startTimeTLP2();
        await sale.setStartTimeTLP2(startTimeTLP2 + duration.days(1));

        set_start_time_tlp2.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetStartTimeTLP2');
        });

        let time2 = await sale.startTimeTLP2();
        assert.equal(time2-time1, duration.days(1));
    });

    it("setStartTimeTLP2 -> wrong owner", async() => {
        let set_start_time_tlp2 = (await sale.SetStartTimeTLP2({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setStartTimeTLP2(startTimeTLP2 + duration.days(1), {from: client1});
        }, "Should has an error");

        set_start_time_tlp2.get((err, events) => {
            assert.equal(events.length, 0);
        });

    });


 
/*
    it("calcAmountAt -> golden tx", async() => {
        let mintCapInTokens = await sale.mintCapInTokens();
        await check_calcAmount(80000e18, startTimeTLP2, wavesTokens, mintCapInTokens-wavesTokens, 4600e18);
    });

    it("token.transfer -> forbid transfer and transferFrom until ITO", async() => {
        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18});

        await shouldHaveException(async () => {
            await token.transfer(client1, 1e8, {from: client1});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await token.transferFrom(client1, client1, 1e8, {from: client1});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await sale.refund({from: client1});
        }, "Should has an error");
    });

    it("token.transfer -> allow transfer token after ITO", async () => {
        await increaseTime(duration.weeks(1));

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18});
        await increaseTime(duration.days(60));
        await sale.finishCrowdsale();

        assert.equal((await token.mintingFinished()), true, 'token.mintingFinished should true');

        await token.transfer(client2, 1e18, {from: client1});

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18});
        }, "Should has an error");
    });

    it("minimalTokenPrice -> do not allow to sell less than minimalTokenPrice", async() => {
        await increaseTime(duration.weeks(1));

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17});

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17 - 1e16});
        }, "Should has an error");
    });

    it("withdraw -> check ether transfer to wallet", async() => {
        let balance1, balance2, balance3;

        balance1 = await web3.eth.getBalance(wallet);
        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18});
        balance2 = await web3.eth.getBalance(wallet);

        assert.equal(Math.round((balance2 - balance1)/1e14), 1e4);
    });


    it("finishCrowdsale -> finish minting", async() => {
        let tokenOnClient, totalSupply;

        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 10e18});

        tokenOnClient = (await token.balanceOf(client1)).toNumber();
        totalSupply = (await token.totalSupply()).toNumber();
        assert.equal(((totalSupply-wavesTokens)/1e18).toFixed(4), (tokenOnClient/1e18).toFixed(4));

        await increaseTime(duration.days(60));
        await sale.finishCrowdsale();
        assert.equal((await token.mintingFinished()), true);
    });

    it("getTokens -> received lower than 0.01 ether", async() => {

        await increaseTime(duration.weeks(1));

        let token_purchase_events = (await sale.TokenPurchase({fromBlock: 0, toBlock: 'latest'}))

        await sale.getTokens(client2, {from: client1, value: 1e18});

        token_purchase_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenPurchase');
        });

        await shouldHaveException(async () => {
            await sale.getTokens(client2, {from: client1, value: 0.009e18});
        }, "Should has an error");
    });

    it("getTokens -> direct call", async() => {
        await increaseTime(duration.weeks(1));

        let client2_balance = (await token.balanceOf(client2));
        await sale.getTokens(client2, {from: client1, value: 100e18});
        let client2_balance2 = (await token.balanceOf(client2));
        assert.notEqual(client2_balance, client2_balance2.toNumber());
        assert.equal(client2_balance2.toNumber(), (await sale.calcAmountAt(100e18, startTime1, wavesTokens))[0]);
    });

    it("Check token balance", async() => {
        await increaseTime(duration.weeks(1));

        await balanceEqualTo(client1, 0);

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: web3.toWei(1)});

        await balanceEqualTo(client1, 1e18/0.065*1000);
    });

    it("After donate", async () => {
        await balanceEqualTo(client1, 0);
        await increaseTime(duration.weeks(1));

        let initialTotalSupply = (await token.totalSupply()).toNumber();
        let tokens = 1e18/0.065*1000;

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: web3.toWei(1)});

        assert.equal(
            ((initialTotalSupply + tokens)/1e18).toFixed(4),
            ((await token.totalSupply()).toNumber()/1e18).toFixed(4),
            "Client balance must be 1 ether / testRate"
        );
        await balanceEqualTo(client1, tokens);
    });

    it("send -> Donate before startTime", async () => {
        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: web3.toWei(4)});
        }, "Should has an error");
    });

    it("send -> Donate after startTime", async () => {
        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: web3.toWei(1)});
    });

    it("send -> Donate max ether", async () => {
        await increaseTime(duration.weeks(1));
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;

        assert.equal((await token.mintingFinished()), false);
        assert.equal((await sale.running()), true);

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});

        await shouldHaveException(async () => {
            await token.transfer(client2, 1e8, {from: client1});
        }, "Should has an error");
        
        await sale.finishCrowdsale();

        assert.equal((await sale.running()), false);
        assert.equal((await token.mintingFinished()), true);

        await token.transfer(client2, 1e8, {from: client1});

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18});
        }, "Should has an error");
    });

    it("send -> Donate more then max ether", async () => {
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;

        await increaseTime(duration.weeks(1));

        let balance1 = await web3.eth.getBalance(client1);
        let token_balance1 = await token.balanceOf(client1);

        let odd_ethers_events = (await sale.TransferOddEther({fromBlock: 0, toBlock: 'latest'}))
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei + 10e18});

        odd_ethers_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TransferOddEther');
        });

        let balance2 = await web3.eth.getBalance(client1);
        let token_balance2 = await token.balanceOf(client1);

        assert.equal(balance1/1e18 - balance2/1e18 - maxWei/1e18, 0, 'Contract should send back our 10 ETH');
        assert.equal(token_balance1.toNumber(), 0);
        assert.equal(Math.round(token_balance2.toNumber()/1e14), Math.round((mintCapInTokens-wavesTokens)/1e14));
    });

    it("send -> Donate after endTime", async () => {
        await increaseTime(duration.days(69));

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client, to: sale.address, value: web3.toWei(4)});
        }, "Should has an error");

        await sale.finishCrowdsale();
        assert.equal((await token.mintingFinished()), true, 'mintingFinished must true');
    });

    it("finishMinting -> test", async () => {
        let end_balance, tokenOnClientWallet, totalSupply;
        let started_balance = (await web3.eth.getBalance(wallet)).toNumber();
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;

        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});


        await sale.finishCrowdsale();

        await shouldHaveException(async () => {
            await sale.finishCrowdsale();
        }, "Should has an error");

        assert.equal((await token.mintingFinished()), true);

        totalSupply = (await token.totalSupply()).toNumber();
        assert.equal(totalSupply, (await sale.hardCapInTokens()).toNumber());

        end_balance = (await web3.eth.getBalance(wallet)).toNumber();
        assert.equal(Math.round((end_balance - started_balance)/1e18), Math.round(maxWei/1e18));

        // token on client wallet
        tokenOnClientWallet = (await token.balanceOf(client1)).toNumber();
        assert.equal(Math.round(((totalSupply/100*70)-wavesTokens)/1e14), Math.round(tokenOnClientWallet/1e14));

        // teamTokens (on contract)
        let tokenOnContract = (await token.balanceOf(sale.address)).toNumber();
        assert.equal(Math.round(totalSupply/100*10/1e14), Math.round(tokenOnContract/1e14));
        assert.equal(await sale.teamTokens(), tokenOnContract);

        // reservedTokens
        let tokenOnReservedWallet = (await token.balanceOf(reservedWallet)).toNumber();
        assert.equal(Math.round(totalSupply/100*10/1e14), Math.round(tokenOnReservedWallet/1e14));
        assert.equal(await sale.reservedTokens(), tokenOnReservedWallet);

        // reservedTokens
        let tokenOnAdvisoryWallet = (await token.balanceOf(advisoryWallet)).toNumber();
        assert.equal(Math.round(totalSupply/100*5/1e14), Math.round(tokenOnAdvisoryWallet/1e14));
        assert.equal(await sale.advisoryTokens(), tokenOnAdvisoryWallet);

        // bounty Offline
        let tokenOnBountyOfflineWallet = (await token.balanceOf(bountyOfflineWallet)).toNumber();
        assert.equal(Math.round(totalSupply/100*3/1e14), Math.round(tokenOnBountyOfflineWallet/1e14));
        assert.equal(await sale.bountyOfflineTokens(), tokenOnBountyOfflineWallet);

        // bounty Online
        let tokenOnBountyOnlineWallet = (await token.balanceOf(bountyOnlineWallet)).toNumber();
        assert.equal(Math.round(totalSupply/100*2/1e14), Math.round(tokenOnBountyOnlineWallet/1e14));
        assert.equal(await sale.bountyOnlineTokens(), tokenOnBountyOnlineWallet);

    });

    it("{bountyOnline,bountyOffline,reserved,team,advisory}Tokens -> before finish", async () => {
        assert.equal((await sale.bountyOnlineTokens()).toNumber(), wavesTokens / 70 * 2, 'bountyOnlineTokens');
        assert.equal((await sale.bountyOfflineTokens()).toNumber(), wavesTokens / 70 * 3, 'bountyOfflineTokens');
        assert.equal((await sale.advisoryTokens()).toNumber(), wavesTokens / 70 * 5, 'advisoryTokens');
        assert.equal((await sale.reservedTokens()).toNumber(), wavesTokens / 70 * 10, 'reservedTokens');
        assert.equal((await sale.teamTokens()).toNumber(), wavesTokens / 70 * 10, 'teamTokens');
    });


    it("{bountyOnline,bountyOffline,reserved,team,advisory}Tokens -> after finish", async () => {
  
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;

        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});
        await sale.finishCrowdsale();

        assert.equal(
            Math.round((await sale.bountyOnlineTokens()).toNumber()/1e10),
            Math.round(mintCapInTokens / 70 * 2 / 1e10),
            'bountyOnlineTokens'
        );
        assert.equal(
            Math.round((await sale.bountyOfflineTokens()).toNumber()/1e10),
            Math.round(mintCapInTokens  / 70 * 3 / 1e10),
            'bountyOfflineTokens'
        );
        assert.equal(
            Math.round((await sale.advisoryTokens()).toNumber()/1e14),
            Math.round(mintCapInTokens / 1e14 / 70 * 5),
            'advisoryTokens'
        );
        assert.equal(
            Math.round((await sale.reservedTokens()).toNumber()/1e14),
            Math.round(mintCapInTokens / 70 * 10 / 1e14),
            'reservedTokens'
        );
        assert.equal(
            Math.round((await sale.teamTokens()).toNumber()/1e14),
            Math.round(mintCapInTokens / 70 * 10 / 1e14),
            'teamTokens'
        );
    });
    it("Transfer -> should do something that fires Transfer", async () => {
        let transfers = (await token.Transfer({fromBlock: 0, toBlock: 'latest'}))

        await increaseTime(duration.weeks(1));

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18});
        transfers.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'Transfer');
        });
    });

    it("wavesAgent -> waves agent can transfer waves tokens without time lock", async () => {

        let token_balance1 = await token.balanceOf(client1);
        await web3.eth.sendTransaction({from: client1, to: wavesAgent, value: 10e18});
        await token.transfer(client1, 1000e18, {from: wavesAgent});
        let token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 1000e18);

        await shouldHaveException(async () => {
            await token.transfer(wavesAgent, 1000e18, {from: client1});
        }, "Should has an error");
    });

    it("finishCrowdsale -> test onlyOwner", async() => {
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;

        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});

        await increaseTime(duration.days(60));

        await shouldHaveException(async () => {
            await sale.finishCrowdsale({from: client});
        }, "Should has an error");

        await sale.finishCrowdsale({from: owner});
    });

    it("fundMinting -> before, after and between", async() => {
        await web3.eth.sendTransaction({from: client1, to: fundMintingAgent, value: 10e18});

        await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});

        await increaseTime(duration.weeks(1));
        await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});

        await increaseTime(duration.days(13));
        await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});

        await increaseTime(duration.days(20));
        await shouldHaveException(async () => {
            await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});
        }, "Should has an error");
    });


    it("fundMinting -> sell all allowed and try to sell over limit", async() => {
        let fund_minting_events = (await sale.FundMinting({fromBlock: 0, toBlock: 'latest'}))
        let fundTokens = (await sale.fundTokens()).toNumber();

        await web3.eth.sendTransaction({from: client1, to: fundMintingAgent, value: 10e18});

        await sale.fundMinting(client1, fundTokens, {from: fundMintingAgent});

        fund_minting_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'FundMinting');
        });

        await shouldHaveException(async () => {
            await sale.fundMinting(client1, 100e18, {from: fundMintingAgent});
        }, "Should has an error");
    });

    it("teamWithdraw -> try to withdraw before end", async() => {
        await web3.eth.sendTransaction({from: client1, to: teamWallet, value: 10e18});
        await increaseTime(duration.weeks(1));
        await shouldHaveException(async () => {
            await sale.teamWithdraw({from: teamWallet});
        }, "Should has an error");

    });

    it("teamWithdraw -> withdraw 1,2,5,8,12 and 13", async() => {
        await increaseTime(duration.weeks(1));
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;
        await web3.eth.sendTransaction({from: client1, to: teamWallet, value: 10e18});
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});
        await sale.finishCrowdsale();

        await increaseTime(duration.days(57));
        await sale.teamWithdraw({from: teamWallet});

        await increaseTime(duration.days(31));
        await sale.teamWithdraw({from: teamWallet});

        await increaseTime(duration.days(31*3));
        await sale.teamWithdraw({from: teamWallet});
        await increaseTime(duration.days(31*3));
        await sale.teamWithdraw({from: teamWallet});

        await increaseTime(duration.days(31*4));
        await sale.teamWithdraw({from: teamWallet});

        assert.notEqual(
            (await token.balanceOf(teamWallet)).toNumber(), 
            (await sale.teamTokens()).toNumber()
        );

        await increaseTime(duration.days(31*4));
        await sale.teamWithdraw({from: teamWallet});

        await increaseTime(duration.days(365));
        await sale.teamWithdraw({from: teamWallet});

        assert.equal(
            (await token.balanceOf(teamWallet)).toNumber(), 
            (await sale.teamTokens()).toNumber()
        );
    });

    it("teamWithdraw -> withdraw 12", async() => {
        await increaseTime(duration.weeks(1));
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});
        await sale.finishCrowdsale();

        let team_vesting_events = (await sale.TeamVesting({fromBlock: 0, toBlock: 'latest'}))

        assert.equal((await token.balanceOf(teamWallet)).toNumber(), 0);

        await increaseTime(duration.days(31*14));
        await sale.teamWithdraw({from: teamWallet});

        team_vesting_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TeamVesting');
        });

        assert.equal(
            (await token.balanceOf(teamWallet)).toNumber(), 
            (await sale.teamTokens()).toNumber()
        );
    });

    it("teamWithdraw -> withdraw 12 with wrong owner", async() => {
        await increaseTime(duration.weeks(1));
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});
        await sale.finishCrowdsale();

        let team_vesting_events = (await sale.TeamVesting({fromBlock: 0, toBlock: 'latest'}))

        await increaseTime(duration.days(31*12));

        await shouldHaveException(async () => {
            await sale.teamWithdraw({from: client1});
        }, "Should has an error");

        team_vesting_events.get((err, events) => {
            assert.equal(events.length, 0);
        });

    });

    it("teamWithdraw -> withdraw 12 with contract owner", async() => {
        await increaseTime(duration.weeks(1));
        let mintCapInTokens = await sale.mintCapInTokens();
        let maxWei = (mintCapInTokens-wavesTokens)/1000*0.065;
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: maxWei});
        await sale.finishCrowdsale();

        await increaseTime(duration.days(31*12));
        let team_vesting_events = (await sale.TeamVesting({fromBlock: 0, toBlock: 'latest'}))
        await sale.teamWithdraw({from: owner});

        team_vesting_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TeamVesting');
        });

    });


    it("setFundMintingAgent -> good owner", async() => {
        let set_fund_minting_events = (await sale.SetFundMintingAgent({fromBlock: 0, toBlock: 'latest'}))

        await sale.setFundMintingAgent(client2);

        set_fund_minting_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetFundMintingAgent');
        });

    });

    it("setFundMintingAgent -> wrong owner", async() => {
        let set_fund_minting_events = (await sale.SetFundMintingAgent({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setFundMintingAgent(client2, {from: client1});
        }, "Should has an error");

        set_fund_minting_events.get((err, events) => {
            assert.equal(events.length, 0);
        });

    });
*/

});

