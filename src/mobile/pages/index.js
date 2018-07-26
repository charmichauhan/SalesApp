import HomePage from './home';
import SALE_PAGES from './sale';

const ROUTES = [
  { path: 'Home', component: HomePage },
]
.concat(SALE_PAGES)

export default ROUTES;
