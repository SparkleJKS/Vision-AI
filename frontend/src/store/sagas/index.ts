import { all } from 'redux-saga/effects';
import navigationSagas from './navigation';

function* rootSaga() {
  yield all([...navigationSagas]);
}

export default rootSaga;
