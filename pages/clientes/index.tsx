import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import { getCustomers } from "../../lib/data/Customers";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid } from "@mui/material";
import Footer from "@/components/Footer";
import { useRouter } from "next/router";

import AddCustomerModal from "@/components/AddCustomerModal";
import { CryptoOrder } from "@/models/crypto_order";
import { subDays } from "date-fns";
import TablaClientes from "./TablaClientes";

function Clientes({ customerList }) {
  const router = useRouter();

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const handleClickOpen = () => {
    setModalIsOpen(true);
  };
  const refreshCustomerList = () => router.replace(router.asPath);
  const handleClose = (addedCustomer) => {
    setModalIsOpen(false);
    if (addedCustomer) {
      refreshCustomerList();
    }
    // setSelectedValue(value);
  };
  const button = { text: "Agregar cliente", onClick: handleClickOpen };
  const cryptoOrders: CryptoOrder[] = [
    {
      id: "1",
      orderDetails: "Fiat Deposit",
      orderDate: new Date().getTime(),
      status: "completed",
      orderID: "VUVX709ET7BY",
      sourceName: "Bank Account",
      sourceDesc: "*** 1111",
      amountCrypto: 34.4565,
      amount: 56787,
      cryptoCurrency: "ETH",
      currency: "$",
    },
    {
      id: "2",
      orderDetails: "Fiat Deposit",
      orderDate: subDays(new Date(), 1).getTime(),
      status: "completed",
      orderID: "23M3UOG65G8K",
      sourceName: "Bank Account",
      sourceDesc: "*** 1111",
      amountCrypto: 6.58454334,
      amount: 8734587,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "3",
      orderDetails: "Fiat Deposit",
      orderDate: subDays(new Date(), 5).getTime(),
      status: "failed",
      orderID: "F6JHK65MS818",
      sourceName: "Bank Account",
      sourceDesc: "*** 1111",
      amountCrypto: 6.58454334,
      amount: 8734587,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "4",
      orderDetails: "Fiat Deposit",
      orderDate: subDays(new Date(), 55).getTime(),
      status: "completed",
      orderID: "QJFAI7N84LGM",
      sourceName: "Bank Account",
      sourceDesc: "*** 1111",
      amountCrypto: 6.58454334,
      amount: 8734587,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "5",
      orderDetails: "Fiat Deposit",
      orderDate: subDays(new Date(), 56).getTime(),
      status: "pending",
      orderID: "BO5KFSYGC0YW",
      sourceName: "Bank Account",
      sourceDesc: "*** 1111",
      amountCrypto: 6.58454334,
      amount: 8734587,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "6",
      orderDetails: "Fiat Deposit",
      orderDate: subDays(new Date(), 33).getTime(),
      status: "completed",
      orderID: "6RS606CBMKVQ",
      sourceName: "Bank Account",
      sourceDesc: "*** 1111",
      amountCrypto: 6.58454334,
      amount: 8734587,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "7",
      orderDetails: "Fiat Deposit",
      orderDate: new Date().getTime(),
      status: "pending",
      orderID: "479KUYHOBMJS",
      sourceName: "Bank Account",
      sourceDesc: "*** 1212",
      amountCrypto: 2.346546,
      amount: 234234,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "8",
      orderDetails: "Paypal Withdraw",
      orderDate: subDays(new Date(), 22).getTime(),
      status: "completed",
      orderID: "W67CFZNT71KR",
      sourceName: "Paypal Account",
      sourceDesc: "*** 1111",
      amountCrypto: 3.345456,
      amount: 34544,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "9",
      orderDetails: "Fiat Deposit",
      orderDate: subDays(new Date(), 11).getTime(),
      status: "completed",
      orderID: "63GJ5DJFKS4H",
      sourceName: "Bank Account",
      sourceDesc: "*** 2222",
      amountCrypto: 1.4389567945,
      amount: 123843,
      cryptoCurrency: "BTC",
      currency: "$",
    },
    {
      id: "10",
      orderDetails: "Wallet Transfer",
      orderDate: subDays(new Date(), 123).getTime(),
      status: "failed",
      orderID: "17KRZHY8T05M",
      sourceName: "Wallet Transfer",
      sourceDesc: "John's Cardano Wallet",
      amountCrypto: 765.5695,
      amount: 7567,
      cryptoCurrency: "ADA",
      currency: "$",
    },
  ];

  return (
    <>
      {customerList.map((customer) => (
        <div key={customer.curp}>
          <a>{customer.curp}</a>
          <br />
        </div>
      ))}
      <Head>
        <title>Clientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Clientes"} sutitle={""} button={button} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            <Card>
              <TablaClientes cryptoOrders={cryptoOrders} />
            </Card>
          </Grid>
        </Grid>
      </Container>

      <AddCustomerModal
        selectedValue={"selectedValue"}
        open={modalIsOpen}
        handleOnClose={handleClose}
      />
      <Footer />
    </>
  );
}

Clientes.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;
export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  if (props.props) {
    props.props.customerList = await getCustomers();
  }
  return props;
}
export default Clientes;
