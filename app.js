document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            getLocationSuccess,
            getLocationError
        );
    } else {
        alert('Tarayıcınız konum özelliğini desteklemiyor.');
    }
});

async function getLocationSuccess(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    try {
        // Detaylı konum bilgisi için Nominatim API kullanımı
        const locationResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const locationData = await locationResponse.json();

        const district =
            locationData.address.suburb ||
            locationData.address.town ||
            locationData.address.city_district;
        const city =
            locationData.address.city ||
            locationData.address.town ||
            locationData.address.county;

        document.getElementById('city').textContent = `${district}, ${city}`;

        // Diyanet API'si veya başka bir API kullanarak tam konum bazlı vakit bilgisi alınabilir
        await getPrayerTimes(latitude, longitude, district);
    } catch (error) {
        document.getElementById('city').textContent =
            'Konum detayları alınamadı';
        console.error('Konum detayları alınırken hata:', error);
    }
}

function getLocationError() {
    document.getElementById('city').textContent = 'Konum alınamadı';
    document.getElementById('prayer-times').innerHTML =
        'Konum izni vermeniz gerekmektedir.';
}

async function getPrayerTimes(latitude, longitude, district) {
    try {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // Diyanet API örneği (gerçek uygulamada kendi API'nizi kullanın)
        const prayerResponse = await fetch(
            `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=13&school=1`
        );
        const prayerData = await prayerResponse.json();

        displayPrayerTimes(prayerData.data.timings, district);
    } catch (error) {
        document.getElementById('prayer-times').innerHTML =
            'Namaz vakitleri alınırken bir hata oluştu.';
        console.error('Namaz vakitleri alınırken hata:', error);
    }
}

function displayPrayerTimes(timings, district) {
    const prayerTimesDiv = document.getElementById('prayer-times');
    const iftarTime = timings.Maghrib;
    const imsakTime = timings.Fajr;

    prayerTimesDiv.innerHTML = `
        <div class="prayer-info">
            <h5 class="mb-3">${district} İçin Vakitler</h5>
            <div class="prayer-time">
                <strong>İftar:</strong> ${iftarTime}
                <div id="iftar-countdown"></div>
            </div>
            <div class="prayer-time">
                <strong>İmsak:</strong> ${imsakTime}
                <div id="imsak-countdown"></div>
            </div>
        </div>
    `;

    setInterval(() => updateCountdowns(iftarTime, imsakTime), 1000);
}

function updateCountdowns(iftarTime, imsakTime) {
    const now = new Date();
    const iftar = new Date(now.toDateString() + ' ' + iftarTime);
    const imsak = new Date(now.toDateString() + ' ' + imsakTime);

    // Adjust dates if time has passed
    if (now > iftar) {
        iftar.setDate(iftar.getDate() + 1);
    }
    if (now > imsak) {
        imsak.setDate(imsak.getDate() + 1);
    }

    // Check which time is next
    const isIftarNext = iftar < imsak;
    const targetTime = isIftarNext ? iftar : imsak;
    const targetElement = isIftarNext ? 'iftar-countdown' : 'imsak-countdown';
    const otherElement = isIftarNext ? 'imsak-countdown' : 'iftar-countdown';

    const diff = targetTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countdown-label').textContent =
        targetElement === 'iftar-countdown'
            ? `İftara Kalan Süre`
            : `İmsak Kalan Süre`;
    document.getElementById('countdown').textContent = `${String(
        hours
    ).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds
    ).padStart(2, '0')}`;
    document.getElementById(targetElement).textContent = `Kalan Süre: ${String(
        hours
    ).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds
    ).padStart(2, '0')}`;
    document.getElementById(otherElement).textContent = '';
}
