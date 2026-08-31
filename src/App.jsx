import AppShell from './components/AppShell.jsx';
import { Toast } from './components/ui.jsx';
import { useRoute } from './lib/route.js';
import { useApp } from './store/app.jsx';
import Landing from './screens/Landing.jsx';
import Catalog from './screens/Catalog.jsx';
import Baker from './screens/Baker.jsx';
import Cart from './screens/Cart.jsx';
import Checkout from './screens/Checkout.jsx';
import Orders from './screens/Orders.jsx';
import OrderDetail from './screens/OrderDetail.jsx';
import Cabinet from './screens/Cabinet.jsx';
import Admin from './screens/Admin.jsx';
import Auth from './screens/Auth.jsx';
import Account from './screens/Account.jsx';

export default function App() {
  const route = useRoute();
  const { toast, ready, user } = useApp();

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream text-mute">
        JOL-Ashkana
      </div>
    );
  }

  if (user?.blocked && route.name !== 'account' && route.name !== 'login') {
    return (
      <AppShell route={route}>
        <Account />
        <Toast message={toast} />
      </AppShell>
    );
  }

  let page = <Landing />;
  if (route.name === 'catalog') page = <Catalog />;
  else if (route.name === 'baker') page = <Baker id={route.id} />;
  else if (route.name === 'cart') page = <Cart />;
  else if (route.name === 'checkout') page = <Checkout />;
  else if (route.name === 'orders') page = <Orders />;
  else if (route.name === 'order') page = <OrderDetail id={route.id} />;
  else if (route.name === 'cabinet') page = <Cabinet tab={route.tab} />;
  else if (route.name === 'admin') page = <Admin />;
  else if (route.name === 'login') page = <Auth mode="login" />;
  else if (route.name === 'register') page = <Auth mode="register" />;
  else if (route.name === 'account') page = <Account />;

  return (
    <AppShell route={route} hideNav={route.name === 'login' || route.name === 'register'}>
      {page}
      <Toast message={toast} />
    </AppShell>
  );
}
