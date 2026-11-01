let apiAdress;

if (import.meta.env.DEV) {
    apiAdress = `http://${window.location.hostname}:3000`;
} else {
    apiAdress = "https://intertext-api.santtu.uk";
}

export default apiAdress;
