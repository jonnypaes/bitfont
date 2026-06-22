export function getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: #${id}`);
    }
    return element;
}

export function showWarning(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

export function clearWarning(element) {
    element.textContent = '';
    element.style.display = 'none';
}
