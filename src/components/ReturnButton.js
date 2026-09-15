export default function ReturnButton(href = "/dashboard") {
    return `
        <a class="button button--icon" href="${href}" aria-label="Volver al panel" data-link><i class="fa-solid fa-angle-left"></i></a>
    `
}