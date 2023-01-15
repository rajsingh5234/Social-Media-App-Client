import axios from 'axios';
import { getItem, KEY_ACCESS_TOKEN, removeItem, setItem } from './localStorageManager';
import store from '../redux/store';
import { setLoading, showToast } from '../redux/slices/appConfigSlice';
import { TOAST_FAILURE } from '../App';

const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_SERVER_BASE_URL,
    withCredentials: true
})

axiosClient.interceptors.request.use(
    (request) => {
        const accessToken = getItem(KEY_ACCESS_TOKEN);
        request.headers['Authorization'] = `Bearer ${accessToken}`;
        store.dispatch(setLoading(true));

        return request;
    }
)

axiosClient.interceptors.response.use(
    async (response) => {
        store.dispatch(setLoading(false));
        const data = response.data;
        if (data.status === 'ok') {
            return data;
        }

        // store the original request
        const originalRequest = response.config;

        const statusCode = data.statusCode;
        const error = data.message;

        store.dispatch(showToast({
            type: TOAST_FAILURE,
            message: error
        }))


        // if access token is expired
        if (statusCode === 401 && !originalRequest._retry) {

            originalRequest._retry = true;

            const response = await axios.create({
                withCredentials: true,
            }).get(`${process.env.REACT_APP_SERVER_BASE_URL}/auth/refresh`)

            if (response.data.status === 'ok') {
                setItem(KEY_ACCESS_TOKEN, response.data.result.accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${response.data.result.accessToken}`;

                // call the original request
                return axios(originalRequest);
            }
            else {
                removeItem(KEY_ACCESS_TOKEN);
                window.location.replace('/login', '_self');
                return Promise.reject(error);
            }
        }

        console.log('axios error', error)

        return Promise.reject(error)
    }, async(error) => {
        store.dispatch(setLoading(false));
        store.dispatch(showToast({
            type: TOAST_FAILURE,
            message: error.message
        }))
        return Promise.reject(error)
    }
)

export default axiosClient