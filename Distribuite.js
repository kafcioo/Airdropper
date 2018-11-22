import React, {Component} from 'react';
import {Button, Form, Input} from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import Layout from '../componenets/Layout';
import Contract from '../ethereum/localInstanceOfContract.js';
import EthereumTx from 'ethereumjs-tx';
import address from './address.js'
import values from './values.js'
import key from './key.js'
import _ from 'lodash';



  class AirDropper extends Component {


sendRawTransaction2 = async () => {
  const correctAddressArray = []

  for (let i = 0; i < address.length; i++) {
    if (web3.utils.isAddress(address[i])) {
      correctAddressArray.push(address[i]);
    }
  };


  const testAddress = _.chunk(_.uniq(correctAddressArray), 100)
  const testValues = _.chunk(values, 100)
  const account= web3.eth.accounts.decrypt(key, 'pass');


  for (let i = 0; i < testAddress.length; i++) {
     function sendSigned(txData, cb) {
      const transaction = new EthereumTx(txData)
      transaction.sign(new Buffer(account.privateKey.replace('0x',""), 'hex'))
      const serializedTx = transaction.serialize().toString('hex')
       web3.eth.sendSignedTransaction('0x' + serializedTx, cb)
    }

    web3.eth.getTransactionCount(account.address).then(txCount => {

      // construct the transaction data
      const txData = {
        nonce: web3.utils.toHex(txCount+i),
        //main net stuff
        //gasLimit: web3.utils.toHex(web3.eth.estimateGas({txData})),
        // gasPrice: web3.utils.toHex(web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(3500000),
        gasPrice: web3.utils.toHex(10000000000),
        to: Contract.options.address,
        data: Contract.methods.distributeAirdrop(0, testAddress[i], testValues[i]).encodeABI()
      }

       sendSigned(txData, function(err, result) {
        if (err)
          return console.log('error', err)
        console.log('sent', result)
      })
    })
  }
}


  render() {

      return (<Layout>
        <h1>hi</h1>
        <Button onClick={this.sendRawTransaction2}>Send trasaction </Button>
      </Layout>);

    }
  }

  export default AirDropper
