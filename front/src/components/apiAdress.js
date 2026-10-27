let apiAdress;

if (import.meta.env.DEV) {
    apiAdress = "http://localhost:3001";
} else {
    apiAdress = "https://intertext.santtu.uk";
}

export default apiAdress;
