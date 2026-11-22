import { render } from 'solid-js/web';
import './styles/global.css';
import App from './App.jsx';

const root = document.getElementById('root');

if (root) {
  render(() => <App />, root);
}
