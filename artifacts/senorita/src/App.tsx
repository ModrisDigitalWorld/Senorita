import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { useAuthStore } from "@/stores/auth";
import BottomNav from "@/components/layout/BottomNav";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Account from "@/pages/Account";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminSizesColors from "@/pages/admin/AdminSizesColors";
import AdminStock from "@/pages/admin/AdminStock";
import About from "@/pages/About";
import CategoryPage from "@/pages/CategoryPage";
import FAQ from "@/pages/FAQ";
import ShippingReturns from "@/pages/ShippingReturns";
import SizeGuide from "@/pages/SizeGuide";
import Contact from "@/pages/Contact";
import StoreLocator from "@/pages/StoreLocator";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { isLoggedIn, isAdmin } = useAuthStore();
  if (!isLoggedIn()) return <Redirect to="/login" />;
  if (!isAdmin()) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/collections/all" component={Shop} />
      <Route path="/new-in" component={Shop} />
      <Route path="/sale" component={Shop} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/account" component={Account} />
      <Route path="/account/orders" component={Account} />
      <Route path="/account/wishlist" component={Account} />
      <Route path="/about" component={About} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/faq" component={FAQ} />
      <Route path="/shipping-returns" component={ShippingReturns} />
      <Route path="/size-guide" component={SizeGuide} />
      <Route path="/contact" component={Contact} />
      <Route path="/store-locator" component={StoreLocator} />
      <Route path="/admin">{() => <AdminGuard component={Dashboard} />}</Route>
      <Route path="/admin/dashboard">{() => <AdminGuard component={Dashboard} />}</Route>
      <Route path="/admin/products">{() => <AdminGuard component={AdminProducts} />}</Route>
      <Route path="/admin/orders">{() => <AdminGuard component={AdminOrders} />}</Route>
      <Route path="/admin/customers">{() => <AdminGuard component={AdminCustomers} />}</Route>
      <Route path="/admin/categories">{() => <AdminGuard component={AdminCategories} />}</Route>
      <Route path="/admin/coupons">{() => <AdminGuard component={AdminCoupons} />}</Route>
      <Route path="/admin/banners">{() => <AdminGuard component={AdminBanners} />}</Route>
      <Route path="/admin/reviews">{() => <AdminGuard component={AdminReviews} />}</Route>
      <Route path="/admin/sizes-colors">{() => <AdminGuard component={AdminSizesColors} />}</Route>
      <Route path="/admin/stock">{() => <AdminGuard component={AdminStock} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return (
    <>
      <Router />
      <CartDrawer />
      {!isAdmin && <BottomNav />}
      {!isAdmin && <WhatsAppButton />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppInner />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
