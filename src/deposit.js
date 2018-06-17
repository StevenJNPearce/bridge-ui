import React from 'react';

import getWeb3 from './getWeb3';
import promisifyWeb3Call from './promisifyWeb3Call';
import { bridge as bridgeAbi, token as tokenAbi } from './abis';
import { bridgeAddress, tokenAddress } from './addrs';

export default class Deposit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { decimals, account } = this.props;
    const { BigNumber } = getWeb3();
    const value = new BigNumber(this.state.value).mul(decimals);
    const web3 = getWeb3(true);
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);

    if (this.props.allowance.lt(value)) {
      // do approveAndCall to token
      const token = web3.eth.contract(tokenAbi).at(tokenAddress);
      const data = bridge.deposit.getData(account, value);
      promisifyWeb3Call(
        token.approveAndCall.sendTransaction,
        bridgeAddress,
        value,
        data,
        {
          from: account,
        }
      ).then(depositTxHash => {
        console.log('deposit', depositTxHash); // eslint-disable-line
        this.setState({ value: 0 });
      });
    } else {
      // call bridge directly
      promisifyWeb3Call(bridge.deposit.sendTransaction, account, value, {
        from: account,
      }).then(depositTxHash => {
        console.log('deposit', depositTxHash); // eslint-disable-line
        this.setState({ value: 0 });
      });
    }
  }

  render() {
    const { symbol, balance, decimals } = this.props;
    const { value } = this.state;
    const bal = Number(balance.div(decimals));

    return (
      <form onSubmit={this.handleSubmit}>
        <h2>Deposit</h2>
        <input
          value={value}
          onChange={e => this.setState({ value: Number(e.target.value) })}
        />
        {symbol}
        <br />
        <button type="submit" disabled={!value || value > bal}>
          Submit
        </button>
      </form>
    );
  }
}