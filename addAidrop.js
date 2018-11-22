import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { createAirdrop } from './airdropsActions';
import { parseFormErrors } from 'Utils/form_errors';
import AirdropForm from './components/AirdropForm';
import Modal from '../shared/components/Modal';

//Damian Stuff
import Web3 from 'web3';
import Axioms from '../../distribute/localInstanceOfContract.js';
import ERC20ABI from '../../distribute/ERC20ABI.js';

class NewAirdrop extends Component {
  constructor(props) {
    super(props);

    this.state = { newAirdropData: null };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.sendEth = this.sendEth.bind(this);
    this.sendERC20 = this.sendERC20.bind(this);

    if (typeof window.web3 !== 'undefined') {
      this.web3 = new Web3(window.web3.currentProvider);
    }
  }

  handleSubmit(values) {
    const { createAirdrop, push } = this.props;
    const airdrop = JSON.parse(values.get('airdrop'));
    var reject, resolve;
    const prom = new Promise((res, rej) => { reject = rej; resolve = res; })
      .then(() => createAirdrop(values))
      .then(() => push('/airdrops/current'))
      .catch(parseFormErrors);

    const cancel = (error) => {
      reject(error || new Error("Cancelled"));
      this.setState({ newAirdropData: null });
    };

    this.setState({ newAirdropData: airdrop, submit: resolve, cancel, sentTokens: false, sentETH: false });
    return prom;
  }

  //damian stuff
  sendERC20(event) {
    event.preventDefault();

    const { newAirdropData: airdrop, cancel } = this.state;
    const { total_tokens, token_smart_contract: smartContract} = airdrop;
    const ERC20Contract = new this.web3.eth.Contract(ERC20ABI, smartContract);

    this.web3.eth.getAccounts()
      .then(accounts => ERC20Contract.methods
        .transfer(smartContract, total_tokens)
        .send({
          from: accounts[0]
        }))
      .then(() => this.setState({ sentTokens: true }))
      .catch(cancel);
  }

  sendEth(event) {
    event.preventDefault();

    const { newAirdropData: airdrop, cancel } = this.state;
    const { total_tokens, name, token_smart_contract: smartContract } = airdrop;

    const coldown = new Date(airdrop.end_date).getTime() / 1000;

    this.web3.eth.getAccounts()
      .then(accounts => Axioms.methods
        .addNewAirdrop(total_tokens, name, coldown, smartContract)
        .send({
          from: accounts[0],
          value: this.web3.utils.toWei("0.1", 'ether')
        }))
      .then(() => this.setState({ sentETH: true }))
      .catch(cancel);
  }

  render() {
    if (!this.web3) {
      return (
        <div>
          <h2>Please use web3 browser to create new airdrops</h2>
        </div>
      );
    }

    const { newAirdropData, cancel, submit, sentTokens, sentETH } = this.state;

    return (
      <div id="airdrop-control" className="row h-100">
        <div className="col-md-11 new-airdrop">
          <span className="airdrop-title">New Airdrops Damian</span>

          <div className="new-airdrop-panel">
            <AirdropForm onSubmit={this.handleSubmit} />
          </div>
        </div>
        {newAirdropData && [
          <Modal key="modal" title="Tokens" onClose={cancel}>
            {sentTokens && sentETH ? (
              <button onClick={submit}>Submit</button>
            ) : (
                sentTokens ? (
                  <button onClick={this.sendEth}>Send ETH</button>
                ) : (
                  <button onClick={this.sendERC20}>Send tokens</button>
                )
            )}
          </Modal>,
          <div key="backdrop" className="modal-backdrop fade show"></div>
        ]}
      </div>
    );
  }
}

export default connect(null, { createAirdrop, push })(NewAirdrop);
