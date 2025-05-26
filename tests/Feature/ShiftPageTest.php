<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Shift;
use Inertia\Testing\AssertableInertia as Assert;

class ShiftPageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test unauthenticated access to shifts page redirects to login.
     *
     * @return void
     */
    public function test_shifts_page_redirects_to_login_if_unauthenticated()
    {
        $response = $this->get('/shifts');
        $response->assertRedirect(route('login'));
    }

    /**
     * Test authenticated user can access the shifts page.
     *
     * @return void
     */
    public function test_authenticated_user_can_view_shifts_page()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get('/shifts');

        $response->assertStatus(200);
        $response->assertSeeText('Shifts'); // Check for the header text
        $response->assertInertia(fn (Assert $page) => $page->component('Shifts/Index'));
    }

    /**
     * Test shifts page displays shift data.
     *
     * @return void
     */
    public function test_shifts_page_displays_shift_data()
    {
        $user = User::factory()->create();

        // Create Shift models directly
        $shift1 = Shift::create(['name' => 'Morning Shift', 'start_time' => '08:00:00', 'end_time' => '16:00:00']);
        $shift2 = Shift::create(['name' => 'Night Shift', 'start_time' => '20:00:00', 'end_time' => '04:00:00']);

        $response = $this->actingAs($user)->get('/shifts');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Shifts/Index')
            ->has('shifts', 2) // Assert that 2 shifts are passed
            ->where('shifts.0.name', $shift1->name)
            ->where('shifts.1.name', $shift2->name)
        );

        // Also assert that the rendered HTML contains the shift names
        $response->assertSeeText($shift1->name);
        $response->assertSeeText($shift2->name);
    }

    /**
     * Test shifts page displays "No shifts found" message when empty.
     *
     * @return void
     */
    public function test_shifts_page_displays_no_shifts_message_when_empty()
    {
        $user = User::factory()->create();
        // No shifts created, RefreshDatabase trait ensures a clean state

        $response = $this->actingAs($user)->get('/shifts');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Shifts/Index')
            ->has('shifts', 0) // Assert that shifts prop is an empty array (or count 0)
        );
        $response->assertSeeText('No shifts found.');
    }
}
