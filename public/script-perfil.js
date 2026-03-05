document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const idUsuarioAlvo = params.get("id"); // Usado pelo Admin para editar outros

    try {
        // 1. Pega dados de quem está logado
        const resMe = await fetch("/api/me");
        const eu = await resMe.json();

        // Se eu for admin, mostra o link do Painel Total na Navbar
        if (eu.role === 'admin') {
            document.getElementById("linkAdminTotal").style.display = "inline-block";
        }

        // 2. Define o ID a carregar (o meu ou o da URL)
        const idFinal = idUsuarioAlvo || eu.id;

        // 3. Busca dados do usuário que será exibido
        const resPerfil = await fetch(`/api/usuarios/${idFinal}`);
        if (!resPerfil.ok) throw new Error("Usuário não encontrado");

        const perfil = await resPerfil.json();

        document.getElementById("info-usuario").textContent = perfil.usuario;
        document.getElementById("info-role").textContent = perfil.role;
        const bioTexto = perfil.descricao || "Nenhuma descricao definida...";
        document.getElementById("exibir-descricao").textContent = bioTexto;
        if (document.getElementById("editDescricao")) {
            document.getElementById("editDescricao").value = perfil.descricao || "";
        }
        document.getElementById("formAlterarSenha").onsubmit = async (e) => {
            e.preventDefault();
            function mostrarNotificacao(texto, sucesso = true) {
                const toast = document.getElementById("toast-msg");

                toast.textContent = texto;
                toast.style.display = "block";
                toast.style.background = sucesso ? "linear-gradient(45deg, #00ffd5, #00aaff)" : "#ff3c3c";
                toast.style.color = sucesso ? "black" : "white";

                // Esconde após 3 segundos
                setTimeout(() => {
                    toast.style.display = "none";
                }, 3000);
            }

            // Captura os valores dos inputs
            const senhaAtual = document.getElementById("senhaAtual").value;
            const novaSenha = document.getElementById("novaSenha").value;
            const descricao = document.getElementById("editDescricao") ? document.getElementById("editDescricao").value : "";

            const msg = document.getElementById("msgErro");

            try {
                const res = await fetch(`/api/usuarios/${idFinal}/perfil-completo`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ senhaAtual, novaSenha, descricao })
                });

                const result = await res.json();

                if (res.ok) {
                    mostrarNotificacao("✅ Perfil atualizado com sucesso!", true);

                    const novaBio = document.getElementById("editDescricao").value;
                    document.getElementById("exibir-descricao").textContent = novaBio || "Nenhuma descricao definida...";
                    document.getElementById("formAlterarSenha").reset();
                } else {
                    mostrarNotificacao("❌ " + (result.error || "Erro ao atualizar"), false);
                }
            } catch (err) {
                console.error(err);
                msg.textContent = "Erro de conexão.";
                msg.style.color = "#ff3c3c";
            }
        };

    } catch (err) {
        console.error("Erro no perfil", err);
        window.location.href = "/admin.html";
    }


});