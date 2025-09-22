const LOTTERY_CONTRACT_ADDRESS = '0xf3102e09B4E9f7327D3E3DfDdD71eA141Ac83405';
const CHAIN_EXPLORER = 'https://web3.okx.com/explorer/x-layer/address/'; 
const LOTTERY_ABI = [
    // Only contains getAllInfo ABI fragment
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" }
        ],
        "name": "getAllInfo",
        "outputs": [
            { "internalType": "uint256[]", "name": "", "type": "uint256[]" },
            { "internalType": "address[]", "name": "", "type": "address[]" },
            { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            return accounts[0];
        } catch (err) {
            alert('请授权钱包访问');
            return null;
        }
    } else {
        alert('Please install MetaMask or other Web3 wallet extension first');
        return null;
    }
}

async function loadLotteryInfo() {
    if (!window.ethereum) {
        alert('请先安装MetaMask或其他Web3钱包扩展');
        return;
    }
    // Connect wallet
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];

    // Initialize Web3 with window.ethereum
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(LOTTERY_ABI, LOTTERY_CONTRACT_ADDRESS);

    try {
        const result = await contract.methods.getAllInfo(userAddress).call();

        const info = result[0];
        const winners = result[1];
        const winnersWinning = result[2];

        const okbAmount = Number(web3.utils.fromWei(info[6], 'ether')) * 0.7;
        document.getElementById('jackpot-amount').innerText = `${okbAmount.toLocaleString('zh-CN', { maximumFractionDigits: 4, minimumFractionDigits: 4 })} OKB ($${(okbAmount * 108.50).toLocaleString('zh-CN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })})`;

        // Info section
        const lastDraw = new Date(Number(info[4]) * 1000);
        document.getElementById('last-draw-time').innerText = lastDraw.toLocaleString('zh-CN');
        document.getElementById('total-weight').innerText = Number(info[1]).toLocaleString('zh-CN');
        document.getElementById('user-weight').innerText = Number(info[0]).toLocaleString('zh-CN');

        // Winner list
        const winnersList = document.getElementById('winners-list');
        winnersList.innerHTML = '';
        if (winners.length === 0) {
            winnersList.innerHTML = '<div class="winner-placeholder">暂无数据</div>';
        } else {
            for (let i = 0; i < winners.length; i++) {
                const addr = winners[i];
                const winAmount = winnersWinning[i] ? web3.utils.fromWei(winnersWinning[i], 'ether') : 0;
                const div = document.createElement('div');
                div.className = 'winner-address fomo';
                div.innerHTML = `<a href="${CHAIN_EXPLORER}${addr}" target="_blank" title="在浏览器中查看">${addr.slice(0,6)}...${addr.slice(-4)}</a> <span class="win-amount">+${Number(winAmount).toLocaleString('zh-CN', {maximumFractionDigits:4})} OKB ($${(winAmount * 105).toLocaleString('zh-CN', {maximumFractionDigits:2, minimumFractionDigits:2})})</span>`;
                winnersList.appendChild(div);
            }
        }
    } catch (e) {
        console.error(e);
        alert('获取合约信息失败，请检查网络和合约地址');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Check web3.js
    if (typeof window.Web3 === 'undefined') {
        const script = document.createElement('script');
        script.src = './web3.min.js';
        script.onload = loadLotteryInfo;
        document.body.appendChild(script);
    } else {
        loadLotteryInfo();
    }
}); 
