import React, { useState, useEffect } from "react";
import {
  FaWallet,
  FaTimes,
  FaDownload,
  FaCreditCard,
  FaPlus,
} from "react-icons/fa";
import Modal from "react-modal";
import "./Wallet.css";
import { useDispatch, useSelector } from "react-redux";
import {
  getWalletBalance,
  rechargeWallet,
} from "../../../api/actions/homeActions";

const Wallet = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status, error, balance } = useSelector((state) => state.homeSlice);

  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [amountToRecharge, setAmountToRecharge] = useState("");
  // const [accountLevel, setAccountLevel] = useState(1);

  // const accountLimits = {
  //   1: 1000,
  //   2: 5000,
  //   3: 10000,
  // };
  useEffect(() => {
    dispatch(getWalletBalance(user?.user_id));
  }, []);

  useEffect(() => {
    if (balance) {
      console.log(balance);
      setWalletBalance(balance);
    }
  }, [balance]);

  const handleRecharge = () => {
    if (!isNaN(parseFloat(amountToRecharge))) {
      // const newBalance = parseFloat(amountToRecharge);
      let object = {
        userId: user?.user_id,
        amount: parseFloat(amountToRecharge),
      };

      dispatch(rechargeWallet(object));
      // setWalletBalance(newBalance);
      // setTransactions([
      //   ...transactions,
      //   {
      //     type: "Recharge",
      //     amount: parseFloat(amountToRecharge),
      //     timestamp: new Date(),
      //   },
      // ]);
      setAmountToRecharge("");
      setIsCardModalOpen(false);
    } else {
      alert("Please enter a valid amount.");
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      transactions
        .map((transaction) => Object.values(transaction).join(","))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transaction_history.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleDownloadCSV = () => {
    if (selectedTransaction) {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        Object.values(selectedTransaction).join(",");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "transaction_details.csv");
      document.body.appendChild(link);
      link.click();
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    return (
      transaction.amount.toString().includes(searchQuery) ||
      transaction.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setSelectedTransaction(null);
    setModalIsOpen(false);
  };

  const openCardModal = () => {
    setIsCardModalOpen(true);
  };

  const closeCardModal = () => {
    setIsCardModalOpen(false);
  };

  return (
    <div className="walletContainer">
      <div className="wallet-header">
        <h2>
          <FaWallet className="wallet-icon" /> Wallet
        </h2>
        <div className="header-right">
          <p className="current-balance">
            Current Balance: <strong> {balance} Rp </strong>
          </p>
          {/* <p className="account-level">
            Account Level: <strong> {accountLevel} </strong> (Limit: $
            {accountLimits[accountLevel]})
          </p> */}
          {/* <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FaDownload /> Export CSV
          </button> */}
        </div>
      </div>

      <div className="wallet-container">
        {/* <div className="transaction-section">
          <h3>Connect Card</h3>
          <button className="btn btn-primary" disabled onClick={openCardModal}>
            <FaCreditCard /> Connect Card
          </button>
        </div> */}

        <div className="transaction-section">
          <h3>Recharge Wallet</h3>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter amount to recharge"
              value={amountToRecharge}
              onChange={(e) => setAmountToRecharge(e.target.value)}
            />
            <div className="input-group-append">
              <button className="btn btn-success" onClick={handleRecharge}>
                <FaPlus /> Recharge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="search-section mt-4">
        <h3>Search Transactions</h3>
        <input
          type="text"
          className="form-control"
          placeholder="Search by amount or type"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div> */}

      {/* <div className="transaction-history mt-4">
        <h3>Transaction History</h3>
        <ul className="list-group">
          {filteredTransactions.map((transaction, index) => (
            <li
              key={index}
              className={`list-group-item ${
                transaction.type === "Recharge"
                  ? "list-group-item-success"
                  : "list-group-item-danger"
              }`}
            >
              <div onClick={() => openModal(transaction)}>
                {transaction.type === "Recharge" ? "Recharged" : "Deducted"} $
                {transaction.amount.toFixed(2)} at{" "}
                {transaction.timestamp
                  ? transaction.timestamp.toLocaleString()
                  : "Unknown"}
              </div>
            </li>
          ))}
        </ul>
      </div> */}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Transaction Details Modal"
        className="transaction-details-modal"
      >
        <div className="header-buttons">
          <FaDownload className="download-icon" onClick={handleDownloadCSV} />
          <FaTimes className="close-icon" onClick={closeModal} />
        </div>
        <h2>Transaction Details</h2>
        {selectedTransaction && (
          <div>
            <p>Type: {selectedTransaction.type}</p>
            <p>Amount: ${selectedTransaction.amount.toFixed(2)}</p>
            <p>
              Timestamp:{" "}
              {selectedTransaction.timestamp
                ? selectedTransaction.timestamp.toLocaleString()
                : "Unknown"}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCardModalOpen}
        onRequestClose={closeCardModal}
        contentLabel="Card Connection Modal"
        className="card-connection-modal"
      >
        <div className="header-buttons">
          <FaTimes className="close-icon" onClick={closeCardModal} />
        </div>
        <h2>Connect Card</h2>
        <form>
          <div className="form-group">
            <label htmlFor="cardNumber">Card Number</label>
            <input
              type="text"
              className="form-control"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRecharge}
          >
            Connect and Recharge
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Wallet;
