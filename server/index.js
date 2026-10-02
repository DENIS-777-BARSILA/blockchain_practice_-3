const express = require("express");
const app = express();
const utf8ToBytes = require("ethereum-cryptography/utils").utf8ToBytes;

const keccak256 = require("ethereum-cryptography/keccak.js").keccak256;
const secp256k1 = require("ethereum-cryptography/secp256k1").secp256k1;

const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "02df6bd0dfc3f5f7bd018f5ad8d427d0d9b6c82d5c6b6440578c37e7f2d2574b2e": 100,
  "020555066b6e8fbf5741a9d20f4d48d8089bda9f26a07589d30e8657a9f4e60d27": 50,
  "023e839a2907f17fa033dd2ca1e2ca737c805b6f086265696d287c23f7c532d31a": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const transaction = req.body;
  console.log(transaction);
  const { sender, recipient, amount, hexSign } = transaction;

  const transactionString = `${sender}|${amount}|${recipient}`;
  const transactionBytes = utf8ToBytes(transactionString);
  const transactionHash = keccak256(transactionBytes);
  const isSigned = secp256k1.verify(hexSign, transactionHash, sender);

  console.log("Is signed: ", isSigned);
  if (isSigned) {
    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }
  else {
    res.status(400).send({ message: "Not signed!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
