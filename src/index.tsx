import ReactDOM from 'react-dom';
import './style.css';

window.addEventListener('popstate', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
});

const Main = () => {
    return <div>Hellow world</div>;
};

ReactDOM.render(<Main />, document.getElementById('root'));
