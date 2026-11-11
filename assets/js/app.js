import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (selector) => document.querySelector(selector);

const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);

function notify(message, error = false) {
    const element = $("#toast");

    if (!element) {
        alert(message);
        return;
    }

    element.hidden = false;
    element.textContent = message;
    element.className = error ? "alert" : "alert success";
}

function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function formatDate(date) {
    if (!date) return "";

    return new Date(date + "T00:00:00").toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

function formatTime(time) {
    if (!time) return "";

    return new Date("1970-01-01T" + time).toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

// ========================================
// AUTHENTICATION
// ========================================

async function getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return data.user;
}

async function getProfile(user) {
    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error.message);
        return null;
    }

    return data;
}

// ========================================
// NAVIGATION
// ========================================

function setupNavigation(user, profile) {
    const page = document.body.dataset.page || "";

    const isNested =
        page.startsWith("student-") ||
        page.startsWith("admin-") ||
        page === "event-detail" ||
        page === "event-form" ||
        page === "participants";

    const root = isNested ? "../" : "";

    let accountLinks = "";

    if (user) {
        if (profile && profile.role === "admin") {
            accountLinks +=
                '<a href="' + root + 'admin/dashboard.html">ADMINISTRATION</a>';
        }

        if (profile && profile.role === "student") {
            accountLinks +=
                '<a href="' + root + 'student/dashboard.html">MY REGISTRATIONS</a>';
        }

        accountLinks +=
            '<a href="#" id="logout-link">LOG OUT</a>';

    } else {
        accountLinks =
            '<a href="' + root + 'login.html">LOGIN</a>' +
            '<a href="' + root + 'register.html">STUDENT SIGN UP</a>';
    }

    const navigation = $("#site-nav");

    if (!navigation) return;

    navigation.innerHTML =
        '<nav class="navbar">' +
            '<div class="brand-wrap">' +
                '<div class="brand-seal">' +
                    '<img src="' + root + 'assets/uep-seal.jpg" alt="University emblem">' +
                '</div>' +
                '<div class="brand">' +
                    'UNIVERSITY EVENT PORTAL' +
                    '<small>STUDENT ACTIVITIES & CAMPUS LIFE</small>' +
                '</div>' +
            '</div>' +
            '<div class="navlinks">' +
                '<a href="' + root + 'index.html">HOME</a>' +
                accountLinks +
            '</div>' +
        '</nav>';

    const logoutLink = $("#logout-link");

    if (logoutLink) {
        logoutLink.addEventListener("click", async function(event) {
            event.preventDefault();

            const { error } = await supabase.auth.signOut();

            if (error) {
                notify(error.message, true);
                return;
            }

            location.href = root + "index.html";
        });
    }
}

// ========================================
// HOMEPAGE
// ========================================

async function loadHomepage() {
    const list = $("#events-list");

    if (!list) return;

    list.innerHTML = "Loading events...";

    const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date")
        .order("event_time");

    if (error) {
        list.innerHTML =
            '<div class="card">Unable to load events: ' +
            escapeHTML(error.message) +
            '</div>';

        console.error(error);
        return;
    }

    const { data: counts, error: countError } = await supabase
        .rpc("get_event_registration_counts");

    if (countError) {
        console.error("Registration counts:", countError);
    }

    const countMap = new Map(
        (counts || []).map(function(item) {
            return [
                item.event_id,
                Number(item.registered_count)
            ];
        })
    );

    if (!events || events.length === 0) {
        list.innerHTML =
            '<div class="card">' +
                '<h3>No Events Available</h3>' +
                '<p>Please check again later.</p>' +
            '</div>';

        return;
    }

    list.innerHTML = events.map(function(event) {
        const registered = countMap.get(event.id) || 0;

        const available = Math.max(
            0,
            Number(event.capacity) - registered
        );

        const eventLink = window.currentUser
            ? "student/event.html?id=" + event.id
            : "login.html";

        return `
            <article class="card">
                <span class="badge">
                    ${formatDate(event.event_date)}
                </span>

                <h3>${escapeHTML(event.title)}</h3>

                <p>${escapeHTML(event.description || "")}</p>

                <p class="muted">
                    <strong>Time:</strong>
                    ${formatTime(event.event_time)}
                    <br>

                    <strong>Venue:</strong>
                    ${escapeHTML(event.location || "")}
                    <br>

                    <strong>Available slots:</strong>
                    ${available} / ${event.capacity}
                </p>

                <a class="btn" href="${eventLink}">
                    ${window.currentUser
                        ? "EVENT DETAILS"
                        : "LOGIN TO REGISTER"}
                </a>
            </article>
        `;
    }).join("");
}

// ========================================
// STUDENT LOGIN
// ========================================

async function loginStudent() {
    const form = $("#login-form");

    if (!form) return;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const data = getFormData(form);

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        });

        if (error) {
            notify(error.message, true);
            return;
        }

        const user = await getUser();
        const profile = await getProfile(user);

        if (profile && profile.role === "admin") {
            location.href = "admin/dashboard.html";
        } else {
            location.href = "student/dashboard.html";
        }
    });
}

// ========================================
// STUDENT REGISTRATION
// ========================================

async function registerStudent() {
    const form = $("#register-form");

    if (!form) return;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const data = getFormData(form);

        if (data.password !== data.confirm_password) {
            notify("Passwords do not match.", true);
            return;
        }

        if (!data.password || data.password.length < 6) {
            notify("Password must contain at least 6 characters.", true);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.full_name
                }
            }
        });

        if (error) {
            notify(error.message, true);
            return;
        }

        form.reset();

        notify(
            "Account created successfully! Check your email if confirmation is required."
        );
    });
}

// ========================================
// STUDENT DASHBOARD
// ========================================

async function loadStudentDashboard(user, profile) {
    const welcome = $("#welcome");

    if (welcome) {
        welcome.textContent =
            "Welcome, " + (profile?.full_name || user.email);
    }

    const table = $("#my-registrations");

    if (!table) return;

    const { data, error } = await supabase
        .from("registrations")
        .select(`
            id,
            registered_at,
            events (
                id,
                title,
                event_date,
                event_time,
                location
            )
        `)
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });

    if (error) {
        notify(error.message, true);
        return;
    }

    if (!data || data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    You have no registrations yet.
                    <a href="../index.html">Browse events</a>.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = data
        .filter(function(row) {
            return row.events;
        })
        .map(function(row) {
            return `
                <tr>
                    <td>${escapeHTML(row.events.title)}</td>
                    <td>${formatDate(row.events.event_date)}</td>
                    <td>${formatTime(row.events.event_time)}</td>
                    <td>${escapeHTML(row.events.location)}</td>
                    <td>
                        <button
                            class="btn danger small"
                            data-cancel="${row.id}">
                            Cancel
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    table.onclick = async function(event) {
        const button = event.target.closest("[data-cancel]");

        if (!button) return;

        const id = button.dataset.cancel;

        if (!confirm("Are you sure you want to cancel this registration?")) {
            return;
        }

        const { error } = await supabase
            .from("registrations")
            .delete()
            .eq("id", id);

        if (error) {
            notify(error.message, true);
            return;
        }

        notify("Registration cancelled successfully.");

        await loadStudentDashboard(user, profile);
    };
}

// ========================================
// EVENT DETAILS
// ========================================

async function loadEventDetails(user) {
    const box = $("#event-detail");

    if (!box) return;

    const eventId = new URLSearchParams(
        location.search
    ).get("id");

    if (!eventId) {
        box.textContent = "No event selected.";
        return;
    }

    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error) {
        box.textContent = "Event not found.";
        return;
    }

    const { data: counts, error: countError } = await supabase
        .rpc("get_event_registration_counts");

    if (countError) {
        notify(countError.message, true);
        return;
    }

    const count = Number(
        (counts || []).find(function(item) {
            return item.event_id === event.id;
        })?.registered_count || 0
    );

    const available = Math.max(
        0,
        Number(event.capacity) - count
    );

    const { data: registration, error: registrationError } =
        await supabase
            .from("registrations")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .maybeSingle();

    if (registrationError) {
        notify(registrationError.message, true);
        return;
    }

    box.innerHTML = `
        <span class="badge">
            ${formatDate(event.event_date)}
        </span>

        <h2>${escapeHTML(event.title)}</h2>

        <p>${escapeHTML(event.description || "")}</p>

        <p>
            <strong>Date:</strong>
            ${formatDate(event.event_date)}
            <br>

            <strong>Time:</strong>
            ${formatTime(event.event_time)}
            <br>

            <strong>Location:</strong>
            ${escapeHTML(event.location || "")}
            <br>

            <strong>Available Slots:</strong>
            ${available}
        </p>

        ${
            registration
                ? '<div class="alert success">You are already registered for this event.</div>'
                : available <= 0
                    ? '<div class="alert">This event is already full.</div>'
                    : '<button class="btn" id="register-event">Register for Event</button>'
        }
    `;

    const registerButton = $("#register-event");

    if (registerButton) {
        registerButton.addEventListener("click", async function() {
            registerButton.disabled = true;
            registerButton.textContent = "Registering...";

            const { error } = await supabase.rpc(
                "register_for_event",
                {
                    p_event_id: Number(eventId)
                }
            );

            if (error) {
                notify(error.message, true);

                registerButton.disabled = false;
                registerButton.textContent = "Register for Event";

                return;
            }

            notify("You have successfully registered!");

            await loadEventDetails(user);
        });
    }
}

// ========================================
// ADMIN DASHBOARD
// ========================================

async function loadAdminDashboard() {
    const [
        studentResult,
        eventResult,
        registrationResult,
        countResult
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "student"),

        supabase
            .from("events")
            .select("*")
            .order("event_date", { ascending: false }),

        supabase
            .from("registrations")
            .select("*", { count: "exact", head: true }),

        supabase.rpc("get_event_registration_counts")
    ]);

    if (studentResult.error) {
        notify(studentResult.error.message, true);
        return;
    }

    if (eventResult.error) {
        notify(eventResult.error.message, true);
        return;
    }

    if (registrationResult.error) {
        notify(registrationResult.error.message, true);
        return;
    }

    if (countResult.error) {
        notify(countResult.error.message, true);
        return;
    }

    if ($("#student-count")) {
        $("#student-count").textContent =
            studentResult.count ?? 0;
    }

    if ($("#event-count")) {
        $("#event-count").textContent =
            eventResult.data.length;
    }

    if ($("#registration-count")) {
        $("#registration-count").textContent =
            registrationResult.count ?? 0;
    }

    const countMap = new Map(
        (countResult.data || []).map(function(item) {
            return [
                item.event_id,
                Number(item.registered_count)
            ];
        })
    );

    const events = eventResult.data || [];
    const table = $("#admin-events");

    if (!table) return;

    table.innerHTML = events.map(function(event) {
        const registered = countMap.get(event.id) || 0;

        return `
            <tr>
                <td>${escapeHTML(event.title)}</td>
                <td>${formatDate(event.event_date)}</td>
                <td>${escapeHTML(event.location || "")}</td>
                <td>${registered} / ${event.capacity}</td>

                <td class="actions">
                    <a class="btn small"
                       href="participants.html?id=${event.id}">
                       Participants
                    </a>

                    <a class="btn secondary small"
                       href="edit-event.html?id=${event.id}">
                       Edit
                    </a>

                    <button
                        class="btn danger small"
                        data-delete="${event.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("") || `
        <tr>
            <td colspan="5">No events available.</td>
        </tr>
    `;

    table.onclick = async function(event) {
        const button = event.target.closest("[data-delete]");

        if (!button) return;

        const id = button.dataset.delete;

        if (!confirm("Delete this event and its registrations?")) {
            return;
        }

        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", id);

        if (error) {
            notify(error.message, true);
            return;
        }

        notify("Event deleted successfully.");

        await loadAdminDashboard();
    };
}

// ========================================
// CREATE AND EDIT EVENTS
// ========================================

async function handleEventForm() {
    const form = $("#event-form");

    if (!form) return;

    const eventId = new URLSearchParams(
        location.search
    ).get("id");

    const editing = Boolean(eventId);

    if (editing) {
        const heading = $("#event-form-title");

        if (heading) {
            heading.textContent = "Edit Event";
        }

        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)
            .single();

        if (error) {
            notify(error.message, true);
            return;
        }

        for (const [key, value] of Object.entries(data)) {
            const input = form.querySelector('[name="' + key + '"]');

            if (input) {
                input.value = value ?? "";
            }
        }
    }

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const data = getFormData(form);

        data.capacity = Number(data.capacity);

        const result = editing
            ? await supabase
                .from("events")
                .update(data)
                .eq("id", eventId)
            : await supabase
                .from("events")
                .insert(data);

        if (result.error) {
            notify(result.error.message, true);
            return;
        }

        notify(
            editing
                ? "Event updated successfully."
                : "Event created successfully."
        );

        location.href = "dashboard.html";
    });
}

// ========================================
// EVENT PARTICIPANTS
// ========================================

async function loadParticipants() {
    const eventId = new URLSearchParams(
        location.search
    ).get("id");

    if (!eventId) {
        notify("No event selected.", true);
        return;
    }

    const [
        eventResult,
        participantResult
    ] = await Promise.all([
        supabase
            .from("events")
            .select("title")
            .eq("id", eventId)
            .single(),

        supabase
            .from("registrations")
            .select(`
                registered_at,
                profiles (
                    full_name,
                    email
                )
            `)
            .eq("event_id", eventId)
            .order("registered_at")
    ]);

    if (eventResult.error || participantResult.error) {
        notify(
            eventResult.error?.message ||
            participantResult.error?.message,
            true
        );

        return;
    }

    const participants = participantResult.data || [];

    const heading = $("#participants-title");

    if (heading) {
        heading.textContent =
            eventResult.data.title +
            " — " +
            participants.length +
            " participant(s)";
    }

    const table = $("#participants-list");

    if (!table) return;

    table.innerHTML = participants.map(function(participant, index) {
        return `
            <tr>
                <td>${index + 1}</td>

                <td>
                    ${escapeHTML(
                        participant.profiles?.full_name || "Unknown"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        participant.profiles?.email || "Not available"
                    )}
                </td>

                <td>
                    ${new Date(
                        participant.registered_at
                    ).toLocaleString()}
                </td>
            </tr>
        `;
    }).join("") || `
        <tr>
            <td colspan="4">
                No participants registered yet.
            </td>
        </tr>
    `;
}

// ========================================
// INITIALIZE WEBSITE
// ========================================

async function initializeApp() {
    const page = document.body.dataset.page || "";

    const user = await getUser();
    const profile = await getProfile(user);

    window.currentUser = user;

    setupNavigation(user, profile);

    switch (page) {
        case "home":
            await loadHomepage();
            break;

        case "login":
            loginStudent();
            break;

        case "register":
            registerStudent();
            break;

        case "student-dashboard":

            if (!user) {
                location.href = "../login.html";
                return;
            }

            if (!profile || profile.role !== "student") {
                location.href = "../index.html";
                return;
            }

            await loadStudentDashboard(user, profile);
            break;

        case "event-detail":

            if (!user) {
                location.href = "../login.html";
                return;
            }

            await loadEventDetails(user);
            break;

        case "admin-dashboard":
        case "event-form":
        case "participants":

            if (!user) {
                location.href = "../login.html";
                return;
            }

            if (!profile || profile.role !== "admin") {
                location.href = "../index.html";
                return;
            }

            if (page === "admin-dashboard") {
                await loadAdminDashboard();
            } else if (page === "event-form") {
                await handleEventForm();
            } else {
                await loadParticipants();
            }

            break;

        default:
            console.warn("Unknown page:", page);
    }
}

// ========================================
// START APPLICATION
// ========================================

initializeApp().catch(function(error) {
    console.error("Application error:", error);
    notify("Something went wrong. Check the browser console.", true);
});
